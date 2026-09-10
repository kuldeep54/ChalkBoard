import React, { createContext, useReducer, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

const initialState = { user: null, token: null, loading: true };

function authReducer(state, action) {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return { ...state, user: action.payload.user, token: action.payload.token, loading: false };
    case "LOAD_FAILURE":
      return { ...state, loading: false };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      return { ...state, user: action.payload.user, token: action.payload.token };
    case "LOGOUT":
      return { ...state, user: null, token: null };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("token");
      const storedUser = await AsyncStorage.getItem("user");
      if (storedToken && storedUser) {
        dispatch({ type: "LOAD_SUCCESS", payload: { token: storedToken, user: JSON.parse(storedUser) } });
      } else {
        dispatch({ type: "LOAD_FAILURE" });
      }
    } catch (err) {
      console.error("Error loading auth:", err);
      dispatch({ type: "LOAD_FAILURE" });
    }
  };

  const register = async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    dispatch({ type: "REGISTER_SUCCESS", payload: { token: newToken, user: newUser } });
    return res.data;
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    await AsyncStorage.setItem("token", newToken);
    await AsyncStorage.setItem("user", JSON.stringify(newUser));
    dispatch({ type: "LOGIN_SUCCESS", payload: { token: newToken, user: newUser } });
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        loading: state.loading,
        register,
        login,
        logout,
        isAuthenticated: !!state.token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;
