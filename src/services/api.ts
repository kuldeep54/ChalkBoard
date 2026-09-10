import { create } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://10.0.2.2:5000/api";

const api = create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      AsyncStorage.removeItem("token");
      AsyncStorage.removeItem("user");
    }
    return Promise.reject(error);
  }
);

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
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
  status: "placed" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  totalAmount: number;
  shippingAddress?: Record<string, string>;
  createdAt: string;
}

export type QueryParams = Record<string, string | number | boolean>;

export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: AuthUser }>("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ success: boolean; token: string; user: AuthUser }>("/auth/login", data),
  getMe: () => api.get<{ success: boolean; user: AuthUser }>("/auth/me"),
  forgotPassword: (email: string) =>
    api.post<{ success: boolean; message: string }>("/auth/forgot-password", { email }),
};

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
  getCategories: () => api.get<{ success: boolean; categories: string[] }>("/products/categories"),
};

export const cartAPI = {
  get: () =>
    api.get<{ success: boolean; cart: { items: CartItem[] } }>("/cart"),
  add: (productId: string, quantity: number) =>
    api.post<{ success: boolean; cart: { items: CartItem[] } }>("/cart/add", {
      productId,
      quantity,
    }),
  update: (productId: string, quantity: number) =>
    api.put<{ success: boolean; cart: { items: CartItem[] } }>("/cart/update", {
      productId,
      quantity,
    }),
  remove: (productId: string) =>
    api.delete<{ success: boolean; cart: { items: CartItem[] } }>(
      `/cart/remove/${productId}`
    ),
};

export interface CartItem {
  _id?: string;
  product?: Product;
  quantity: number;
}

export const ordersAPI = {
  create: (shippingAddress: Record<string, string>) =>
    api.post<{ success: boolean; order: Order }>("/orders", { shippingAddress }),
  getAll: () =>
    api.get<{ success: boolean; orders: Order[] }>("/orders"),
  getById: (id: string) =>
    api.get<{ success: boolean; order: Order }>(`/orders/${id}`),
};

export default api;