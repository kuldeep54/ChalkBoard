import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://10.0.2.2:5000/api";

const api = axios.create({
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

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  getMe: () => api.get("/auth/me"),
};

export const productsAPI = {
  getAll: (params) => api.get("/products", { params }),
  getById: (id) => api.get(`/products/${id}`),
  getCategories: () => api.get("/products/categories"),
};

export const cartAPI = {
  get: () => api.get("/cart"),
  add: (productId, quantity) =>
    api.post("/cart/add", { productId, quantity }),
  update: (productId, quantity) =>
    api.put("/cart/update", { productId, quantity }),
  remove: (productId) => api.delete(`/cart/remove/${productId}`),
};

export const ordersAPI = {
  create: (shippingAddress) => api.post("/orders", { shippingAddress }),
  getAll: () => api.get("/orders"),
  getById: (id) => api.get(`/orders/${id}`),
};

export default api;
