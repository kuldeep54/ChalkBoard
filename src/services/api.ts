import { create, AxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { secureDelete, secureGet, secureSet } from "./storage";
import { emitAuthLogout } from "../utils/authEvents";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:5000/api";

// ── axios instance ──────────────────────────────────────────────────────
const api = create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ── request interceptor ─────────────────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const token = await secureGet("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── response interceptor — token refresh + forced logout ─────────────────
let isRefreshing = false;
let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If we already retried or this is the refresh call itself, bail out.
    if (
      originalRequest?._retry ||
      originalRequest?._isRefreshRequest ||
      originalRequest?.url?.startsWith("/auth/refresh") ||
      originalRequest?.url?.startsWith("/auth/login") ||
      originalRequest?.url?.startsWith("/auth/register")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      const storedRefreshToken = await secureGet("refreshToken");
      if (!storedRefreshToken) {
        emitAuthLogout();
        return Promise.reject(error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = api
          .post(
            "/auth/refresh",
            { refreshToken: storedRefreshToken },
            { _isRefreshRequest: true } as any
          )
          .then(async (res) => {
            const { accessToken, refreshToken: newRefreshToken } = res.data;
            await secureSet("accessToken", accessToken);
            await secureSet("refreshToken", newRefreshToken);
            return res.data;
          })
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        await refreshPromise;

        originalRequest._retry = true;
        const newToken = await secureGet("accessToken");
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return api(originalRequest);
      } catch {
        await secureDelete("accessToken");
        await secureDelete("refreshToken");
        await AsyncStorage.removeItem("user");
        emitAuthLogout();
      }
    }

    return Promise.reject(error);
  }
);

// ── API helpers ─────────────────────────────────────────────────────────

export interface AuthUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  status: "pending" | "active";
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  description: string;
  stock: number;
  rating: number;
  ratingCount?: number;
  featured?: boolean;
  trending?: boolean;
  image?: string;
  images?: string[];
  createdAt?: string;
  isOnSale?: boolean;
  discountPercent?: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface OrderItem {
  product?: string;
  name: string;
  price: number;
  quantity: number;
  coverImage?: string;
}

export interface Order {
  _id: string;
  status: "pending" | "placed" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: Record<string, string>;
  createdAt: string;
}

export type QueryParams = Record<string, string | number | boolean>;

export interface Review {
  _id: string;
  user: { _id: string; name: string };
  rating: number;
  comment: string;
  createdAt: string;
}

// ── Auth endpoints ──────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<
      {
        success: boolean;
        requiresVerification?: boolean;
        email?: string;
        message?: string;
      }
    >("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post<
      {
        success: boolean;
        accessToken?: string;
        refreshToken?: string;
        user?: AuthUser;
        requiresVerification?: boolean;
        email?: string;
      }
    >("/auth/login", data),

  getMe: () =>
    api.get<{ success: boolean; user: AuthUser }>("/auth/me"),

  refresh: (refreshToken: string) =>
    api.post<{ success: boolean; accessToken: string; refreshToken: string }>(
      "/auth/refresh",
      { refreshToken }
    ),

  logout: (refreshToken: string | null) =>
    api.post<{ success: boolean }>("/auth/logout", { refreshToken }),

  verifyEmail: (code: string) =>
    api.post<{ success: boolean; message: string }>(
      "/auth/verify-email",
      { code }
    ),

  resendVerification: (email: string) =>
    api.post<{ success: boolean; message: string }>(
      "/auth/resend-verification",
      { email }
    ),

  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>(
      "/auth/forgot-password",
      { email }
    ),

  resetPassword: (code: string, newPassword: string) =>
    api.post<{ success: boolean; message: string }>(
      "/auth/reset-password",
      { code, newPassword }
    ),
};

// ── Products endpoints ──────────────────────────────────────────────────

export const productsAPI = {
  getAll: (params?: QueryParams) =>
    api.get<
      { success: boolean; count: number; pagination: Pagination; products: Product[] }
    >("/products", { params }),

  getById: (id: string | string[]) =>
    api.get<{ success: boolean; product: Product }>(`/products/${id}`),

  getRelated: (id: string, params?: QueryParams) =>
    api.get<{ success: boolean; count: number; products: Product[] }>(
      `/products/${id}/related`,
      { params }
    ),

  getCategories: () =>
    api.get<{ success: boolean; categories: string[] }>("/products/categories"),

  getReviews: (id: string | string[]) =>
    api.get<{
      success: boolean;
      averageRating: number;
      reviewCount: number;
      reviews: Review[];
    }>(`/products/${id}/reviews`),

  createReview: (id: string, rating: number, comment: string) =>
    api.post<{ success: boolean; message: string }>(
      `/products/${id}/reviews`,
      { rating, comment }
    ),
};

// ── Cart endpoints ──────────────────────────────────────────────────────

export interface CartItem {
  _id?: string;
  product?: Product;
  quantity: number;
}

export const cartAPI = {
  get: () =>
    api.get<{ success: boolean; cart: { items: CartItem[] } }>("/cart"),

  add: (productId: string, quantity: number) =>
    api.post<{ success: boolean; cart: { items: CartItem[] } }>(
      "/cart/add",
      { productId, quantity }
    ),

  update: (productId: string, quantity: number) =>
    api.put<{ success: boolean; cart: { items: CartItem[] } }>(
      "/cart/update",
      { productId, quantity }
    ),

  remove: (productId: string) =>
    api.delete<{ success: boolean; cart: { items: CartItem[] } }>(
      `/cart/remove/${productId}`
    ),

  merge: (items: { productId: string; quantity: number }[]) =>
    api.post<{ success: boolean; cart: { items: CartItem[] } }>(
      "/cart/merge",
      { items }
    ),
};

// ── Addresses endpoints ────────────────────────────────────────────────

export interface Address {
  _id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export const addressAPI = {
  getAll: () =>
    api.get<{ success: boolean; addresses: Address[] }>("/addresses"),

  add: (data: Omit<Address, "_id" | "isDefault">) =>
    api.post<{ success: boolean; address: Address; addresses: Address[] }>(
      "/addresses",
      data
    ),

  setDefault: (id: string) =>
    api.put<{ success: boolean; addresses: Address[] }>(
      `/addresses/${id}/default`
    ),

  delete: (id: string) =>
    api.delete<{ success: boolean; addresses: Address[] }>(
      `/addresses/${id}`
    ),
};

// ── Orders endpoints ────────────────────────────────────────────────────

export const ordersAPI = {
  create: (shippingAddress: Record<string, string>) =>
    api.post<{ success: boolean; order: Order }>("/orders", {
      shippingAddress,
    }),

  getAll: () =>
    api.get<{ success: boolean; orders: Order[] }>("/orders"),

  getById: (id: string) =>
    api.get<{ success: boolean; order: Order }>(`/orders/${id}`),
};

export default api;