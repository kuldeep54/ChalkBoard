import React, {
  createContext,
  useReducer,
  useEffect,
  useContext,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, AuthUser } from "../services/api";
import { secureDelete, secureGet, secureSet } from "../services/storage";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: "LOAD_SUCCESS"; payload: { user: AuthUser; token: string } }
  | { type: "LOAD_FAILURE" }
  | { type: "AUTH_SUCCESS"; payload: { user: AuthUser; token: string } }
  | { type: "LOGOUT" };

const initialState: AuthState = { user: null, token: null, loading: true };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOAD_SUCCESS":
      return {
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case "LOAD_FAILURE":
      return { ...state, loading: false };
    case "AUTH_SUCCESS":
      return { user: action.payload.user, token: action.payload.token, loading: false };
    case "LOGOUT":
      return { user: null, token: null, loading: false };
    default:
      return state;
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  register: (name: string, email: string, password: string) => Promise<unknown>;
  login: (email: string, password: string) => Promise<unknown>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await secureGet("token");
      const storedUser = await AsyncStorage.getItem("user");
      if (storedToken && storedUser) {
        dispatch({
          type: "LOAD_SUCCESS",
          payload: { token: storedToken, user: JSON.parse(storedUser) as AuthUser },
        });
      } else {
        dispatch({ type: "LOAD_FAILURE" });
      }
    } catch (err) {
      console.error("Error loading auth:", err);
      dispatch({ type: "LOAD_FAILURE" });
    }
  };

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const register = async (name: string, email: string, password: string) => {
    const res = await authAPI.register({ name, email, password });
    const { token, user } = res.data;
    await secureSet("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    dispatch({ type: "AUTH_SUCCESS", payload: { token, user } });
    return res.data;
  };

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { token, user } = res.data;
    await secureSet("token", token);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    dispatch({ type: "AUTH_SUCCESS", payload: { token, user } });
    return res.data;
  };

  const logout = async () => {
    await secureDelete("token");
    await AsyncStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      token: state.token,
      loading: state.loading,
      isAuthenticated: !!state.token,
      register,
      login,
      logout,
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export default AuthContext;