import React, {
  createContext,
  useReducer,
  useEffect,
  useContext,
  useMemo,
} from "react";
import { cartAPI, CartItem } from "../services/api";
import { salePrice } from "../utils/helpers";
import { useAuth } from "./AuthContext";

export interface Cart {
  items: CartItem[];
}

interface CartState {
  cart: Cart;
  loading: boolean;
}

const initialState: CartState = { cart: { items: [] }, loading: false };

type CartAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CART"; payload: Cart }
  | { type: "CLEAR_CART" };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_CART":
      return { ...state, cart: action.payload, loading: false };
    case "CLEAR_CART":
      return { ...state, cart: { items: [] } };
    default:
      return state;
  }
}

interface CartContextValue {
  cart: Cart;
  loading: boolean;
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

  const fetchCart = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const res = await cartAPI.get();
      dispatch({ type: "SET_CART", payload: res.data.cart });
    } catch (err) {
      console.error("Error fetching cart:", err);
      dispatch({ type: "SET_LOADING", payload: false });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      dispatch({ type: "CLEAR_CART" });
    }
  }, [isAuthenticated]);

  const addToCart = async (productId: string, quantity = 1) => {
    const res = await cartAPI.add(productId, quantity);
    dispatch({ type: "SET_CART", payload: res.data.cart });
    return res.data;
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const res = await cartAPI.update(productId, quantity);
    dispatch({ type: "SET_CART", payload: res.data.cart });
    return res.data;
  };

  const removeFromCart = async (productId: string) => {
    const res = await cartAPI.remove(productId);
    dispatch({ type: "SET_CART", payload: res.data.cart });
    return res.data;
  };

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

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
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      cartTotal,
      cartCount,
    }),
    [state, cartTotal, cartCount]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

export default CartContext;