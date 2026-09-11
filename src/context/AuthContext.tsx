import React, {
  createContext,
  useReducer,
  useEffect,
  useContext,
  useMemo,
  useRef,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, AuthUser } from "../services/api";
import { secureDelete, secureGet, secureSet } from "../services/storage";
import { onAuthLogout } from "../utils/authEvents";

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
      return {
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
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
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<unknown>;
  login: (email: string, password: string) => Promise<unknown>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Force logout when the token refresh fails (emitted from api.ts).
  useEffect(() => {
    const unsub = onAuthLogout(() => {
      if (!mountedRef.current) return;
      dispatch({ type: "LOGOUT" });
    });
    return () => unsub();
  }, []);

  // Validate stored session on launch.
  const loadStoredAuth = async () => {
    try {
      const storedToken = await secureGet("accessToken");
      const storedRefresh = await secureGet("refreshToken");
      const storedUser = await AsyncStorage.getItem("user");

      if (!storedToken || !storedRefresh || !storedUser) {
        dispatch({ type: "LOAD_FAILURE" });
        return;
      }

      // Call /auth/me — the interceptor will transparently refresh an expired
      // access token before rejecting. If refresh also fails, the listener
      // above will dispatch LOGOUT.
      const res = await authAPI.getMe();
      if (mountedRef.current) {
        dispatch({
          type: "LOAD_SUCCESS",
          payload: { token: storedToken, user: res.data.user },
        });
      }
    } catch {
      if (mountedRef.current) {
        dispatch({ type: "LOAD_FAILURE" });
      }
    }
  };

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const register = async (
    name: string,
    email: string,
    password: string
  ) => {
    const res = await authAPI.register({ name, email, password });
    return res.data;
  };

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    const { accessToken, refreshToken, user } = res.data;
    if (!accessToken || !refreshToken || !user) {
      throw new Error("Login failed");
    }
    await secureSet("accessToken", accessToken);
    await secureSet("refreshToken", refreshToken);
    await AsyncStorage.setItem("user", JSON.stringify(user));
    dispatch({ type: "AUTH_SUCCESS", payload: { token: accessToken, user } });
    return res.data;
  };

  const logout = async () => {
    const storedRefresh = await secureGet("refreshToken");
    // Best-effort server-side revocation; ignore errors.
    if (storedRefresh) {
      try {
        await authAPI.logout(storedRefresh);
      } catch {
        /* ignore */
      }
    }
    await secureDelete("accessToken");
    await secureDelete("refreshToken");
    await AsyncStorage.removeItem("user");
    dispatch({ type: "LOGOUT" });
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      token: state.token,
      loading: state.loading,
      isAuthenticated: !!state.token && !!state.user,
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