import React, {
  createContext,
  useReducer,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cartAPI, productsAPI, CartItem, Product } from "../services/api";
import { salePrice } from "../utils/helpers";
import { useAuth } from "./AuthContext";

const GUEST_CART_KEY = "guest_cart";

export interface Cart {
  items: CartItem[];
}

interface CartState {
  cart: Cart;
  loading: boolean;
  isGuest: boolean;
}

const initialState: CartState = { cart: { items: [] }, loading: false, isGuest: false };

type CartAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CART"; payload: Cart }
  | { type: "SET_GUEST"; payload: boolean }
  | { type: "CLEAR_CART" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CART":
      return { ...state, cart: action.payload, loading: false };
    case "SET_GUEST":
      return { ...state, isGuest: action.payload };
    case "CLEAR_CART":
      return { ...state, cart: { items: [] } };
    default:
      return state;
  }
}

// ── Guest cart persistence ──────────────────────────────────────────────

const loadGuestCart = async (): Promise<CartItem[]> => {
  try {
    const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
};

const saveGuestCart = async (items: CartItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    /* best effort */
  }
};

/** Hydrate the stored guest cart by re-fetching product snapshots so prices/stock are fresh. */
const withFreshProducts = async (items: CartItem[]): Promise<CartItem[]> => {
  const fresh: CartItem[] = [];
  for (const item of items) {
    if (!item.product?._id) continue;
    const id = item.product._id;
    const existing = fresh.find((f) => f.product?._id === id);
    if (existing) {
      existing.quantity += item.quantity;
      continue;
    }
    fresh.push({ _id: id, product: item.product, quantity: item.quantity });
  }
  return fresh;
};

interface CartContextValue {
  cart: Cart;
  loading: boolean;
  isGuest: boolean;
  cartTotal: number;
  cartCount: number;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<unknown>;
  updateQuantity: (productId: string, quantity: number) => Promise<unknown>;
  removeFromCart: (productId: string) => Promise<unknown>;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();
  const mergedRef = useRef(false);

  // ── Server cart (logged in) ───────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await cartAPI.get();
      dispatch({ type: "SET_CART", payload: res.data.cart });
    } catch (err) {
      console.error("Error fetching cart:", err);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  // ── Own the guest cart on first sight, statically (no server) ─────────
  // When auth state changes: guest → server cart, and merge any guest items.
  useEffect(() => {
    if (isAuthenticated) {
      (async () => {
        mergedRef.current = false;
        dispatch({ type: "SET_GUEST", payload: false });
        dispatch({ type: "SET_LOADING", payload: true });

        const guestItems = await loadGuestCart();
        if (guestItems.length > 0 && !mergedRef.current) {
          mergedRef.current = true;
          try {
            await cartAPI.merge(
              guestItems
                .filter((i) => i.product?._id)
                .map((i) => ({ productId: i.product!._id, quantity: i.quantity }))
            );
            await AsyncStorage.removeItem(GUEST_CART_KEY);
          } catch (err) {
            console.error("Error merging guest cart:", err);
          }
        }
        await fetchCart();
        dispatch({ type: "SET_LOADING", payload: false });
      })();
    } else {
      (async () => {
        dispatch({ type: "SET_GUEST", payload: true });
        const items = await loadGuestCart();
        const fresh = await withFreshProducts(items);
        await saveGuestCart(fresh);
        dispatch({ type: "SET_CART", payload: { items: fresh } });
        dispatch({ type: "SET_LOADING", payload: false });
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── add / update / remove — server cart OR local guest cart ────────────

  const addToCart = async (productId: string, quantity = 1) => {
    if (!state.isGuest) {
      const res = await cartAPI.add(productId, quantity);
      dispatch({ type: "SET_CART", payload: res.data.cart });
      return res.data;
    }

    const list = await loadGuestCart();
    const existing = list.find((i) => i.product?._id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      const product = await fetchProduct(productId);
      if (!product) throw new Error("Product not found");
      list.push({ _id: productId, product, quantity });
    }
    await saveGuestCart(list);
    dispatch({ type: "SET_CART", payload: { items: list } });
    return { success: true };
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!state.isGuest) {
      const res = await cartAPI.update(productId, quantity);
      dispatch({ type: "SET_CART", payload: res.data.cart });
      return res.data;
    }

    const list = await loadGuestCart();
    const item = list.find((i) => i.product?._id === productId);
    if (item) {
      const maxStock = item.product?.stock ?? Infinity;
      item.quantity = Math.max(1, Math.min(quantity, maxStock));
    }
    await saveGuestCart(list);
    dispatch({ type: "SET_CART", payload: { items: list } });
    return { success: true };
  };

  const removeFromCart = async (productId: string) => {
    if (!state.isGuest) {
      const res = await cartAPI.remove(productId);
      dispatch({ type: "SET_CART", payload: res.data.cart });
      return res.data;
    }

    const list = await loadGuestCart();
    const next = list.filter((i) => i.product?._id !== productId);
    await saveGuestCart(next);
    dispatch({ type: "SET_CART", payload: { items: next } });
    return { success: true };
  };

  const clearCart = () => {
    if (state.isGuest) {
      AsyncStorage.removeItem(GUEST_CART_KEY).catch(() => {});
    }
    dispatch({ type: "CLEAR_CART" });
  };

  const cartTotal = state.cart.items.reduce(
    (total, item) => total + salePrice(item.product) * item.quantity,
    0
  );

  const cartCount = state.cart.items.reduce(
    (count, item) => count + item.quantity,
    0
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart: state.cart,
      loading: state.loading,
      isGuest: state.isGuest,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      cartTotal,
      cartCount,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, cartTotal, cartCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

async function fetchProduct(productId: string): Promise<Product | null> {
  try {
    const res = await productsAPI.getById(productId);
    return res.data.product;
  } catch {
    return null;
  }
}

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

export default CartContext;