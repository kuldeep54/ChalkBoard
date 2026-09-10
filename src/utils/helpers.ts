import Toast from "react-native-toast-message";
import type { Product } from "../services/api";

export const formatMoney = (amount?: number | null): string =>
  `$${Number(amount || 0).toFixed(2)}`;

export const isValidEmail = (email: string): boolean =>
  /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email.trim());

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const salePrice = (product?: Product | null): number => {
  if (!product) return 0;
  const { price, discountPrice } = product;
  return discountPrice && discountPrice < price ? discountPrice : price;
};

export const isOnSale = (product?: Product | null): boolean =>
  !!product?.discountPrice && product.discountPrice < product.price;

export const productImage = (
  product?: Pick<Product, "images" | "image"> | null,
  index: number = 0
): string | null => product?.images?.[index] || product?.image || null;

export const discountPercent = (product?: Product | null): number => {
  if (!product || !isOnSale(product)) return 0;
  return Math.round(
    ((product.price - (product.discountPrice as number)) / product.price) * 100
  );
};

interface ToastOptions {
  onPress?: () => void;
  [key: string]: unknown;
}

export const toastSuccess = (text1: string, text2 = "", options?: ToastOptions) =>
  Toast.show({ type: "success", text1, text2, position: "top", ...options });

export const toastError = (text1: string, text2 = "", options?: ToastOptions) =>
  Toast.show({ type: "error", text1, text2, position: "top", ...options });

export const toastInfo = (text1: string, text2 = "", options?: ToastOptions) =>
  Toast.show({ type: "info", text1, text2, position: "top", ...options });

export const getErrorMessage = (
  err: unknown,
  fallback = "Something went wrong"
): string => {
  if (!err || typeof err !== "object") return fallback;
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e.response?.data?.message || e.message || fallback;
};