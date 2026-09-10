import React, { createContext, useReducer, useEffect, useContext } from "react";
import { cartAPI } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const initialState = { cart: { items: [] }, loading: false };

function cartReducer(state, action) {
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

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) fetchCart();
    else dispatch({ type: "CLEAR_CART" });
  }, [isAuthenticated]);

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

  const addToCart = async (productId, quantity = 1) => {
    const res = await cartAPI.add(productId, quantity);
    dispatch({ type: "SET_CART", payload: res.data.cart });
    return res.data;
  };

  const updateQuantity = async (productId, quantity) => {
    const res = await cartAPI.update(productId, quantity);
    dispatch({ type: "SET_CART", payload: res.data.cart });
    return res.data;
  };

  const removeFromCart = async (productId) => {
    const res = await cartAPI.remove(productId);
    dispatch({ type: "SET_CART", payload: res.data.cart });
    return res.data;
  };

  const clearCart = () => dispatch({ type: "CLEAR_CART" });

  const cartTotal = state.cart.items.reduce(
    (total, item) => total + (item.product?.price || 0) * item.quantity,
    0
  );

  const cartCount = state.cart.items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart: state.cart,
        loading: state.loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
};

export default CartContext;
