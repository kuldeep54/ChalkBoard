import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import RatingStars from "./rating-stars";
import GoldButton from "./gold-button";
import type { Product } from "../services/api";
import { useCart } from "../context/CartContext";
import {
  formatMoney,
  salePrice,
  isOnSale,
  productImage,
  discountPercent,
  toastSuccess,
  toastError,
  getErrorMessage,
} from "../utils/helpers";

export default function ProductCard({
  product,
  width,
  variant = "grid",
}: {
  product: Product;
  width?: number;
  variant?: "grid" | "list";
}) {
  const image = productImage(product) ?? undefined;
  const price = salePrice(product);
  const original = product.price;
  const onSale = isOnSale(product);
  const { addToCart } = useCart();
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      toastSuccess(`${product.name} added`, "Tap to view cart");
    } catch (err) {
      toastError("Couldn't add to cart", getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const stockLabel =
    product.stock > 10
      ? "In stock"
      : product.stock > 0
        ? `Only ${product.stock} left`
        : "Out of stock";

  const deliveryLine = (compact: boolean) => (
    <View className={compact ? "mt-0.5 flex-row items-center gap-1" : "mt-1 flex-row items-center gap-1"}>
      <Ionicons name="checkmark-circle" size={compact ? 11 : 12} color="#16A34A" />
      <Text className="text-[11px] text-chalk-tertiary">FREE Delivery</Text>
    </View>
  );

  if (variant === "list") {
    return (
      <View className="mb-3 overflow-hidden rounded-lg border border-chalk-line bg-white">
        <Link href={`/product/${product._id}`} asChild>
          <TouchableOpacity className="flex-row">
            <Image
              source={{ uri: image }}
              className="h-28 w-24 bg-chalk-mist"
              resizeMode="cover"
            />
            <View className="flex-1 p-3">
              <Text numberOfLines={2} className="text-[13px] font-medium leading-4 text-chalk-ink">
                {product.name}
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-[11px] text-chalk-slate">
                • {product.category} · {product.stock > 0 ? stockLabel : "Currently unavailable"}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <RatingStars rating={product.rating} size={12} />
                <Text className="ml-1 text-[11px] text-chalk-tertiary">
                  ({product.ratingCount || 0})
                </Text>
              </View>
              {deliveryLine(true)}
              <View className="mt-1 flex-row items-center gap-1.5">
                <Text className="text-[15px] font-bold text-chalk-ink">
                  {formatMoney(price)}
                </Text>
                {onSale && (
                  <Text className="text-[11px] text-chalk-tertiary line-through">
                    {formatMoney(original)}
                  </Text>
                )}
                {onSale && (
                  <Text className="text-[12px] font-bold text-chalk-red">
                    -{discountPercent(product)}%
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Link>
        <View className="border-t border-chalk-line p-2">
          <GoldButton
            className="items-center px-3 py-1.5"
            onPress={handleAdd}
            disabled={adding || product.stock === 0}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="add" size={15} color="#111111" />
              <Text className="ml-1 text-[12px] font-semibold text-[#111111]">
                {product.stock === 0 ? "Unavailable" : "Add to Cart"}
              </Text>
            </View>
          </GoldButton>
        </View>
        {onSale && (
          <View className="absolute left-0 top-2 rounded-r bg-chalk-red px-1.5 py-0.5">
            <Text className="text-[10px] font-bold text-white">
              -{discountPercent(product)}%
            </Text>
          </View>
        )}
      </View>
    );
  }

  const cardWidth = width || "flex-1";

  return (
    <View
      className="overflow-hidden rounded-lg border border-chalk-line bg-white"
      style={{ width: cardWidth === "flex-1" ? undefined : cardWidth }}
    >
      <Link href={`/product/${product._id}`} asChild>
        <TouchableOpacity>
          <Image
            source={{ uri: image }}
            className="aspect-square w-full bg-chalk-mist"
            resizeMode="cover"
          />
          <View className="p-2.5">
            <Text numberOfLines={2} className="min-h-8 text-[13px] font-medium leading-4 text-chalk-ink">
              {product.name}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-[11px] text-chalk-slate">
              • {product.category} · {stockLabel}
            </Text>
            <View className="mt-0.5 flex-row items-center">
              <RatingStars rating={product.rating} size={11} />
              <Text className="ml-1 text-[11px] text-chalk-tertiary">
                ({product.ratingCount || 0})
              </Text>
            </View>
            {deliveryLine(true)}
            <View className="mt-1 flex-row items-center gap-1.5">
              <Text className="text-[15px] font-bold text-chalk-ink">
                {formatMoney(price)}
              </Text>
              {onSale && (
                <Text className="text-[11px] text-chalk-tertiary line-through">
                  {formatMoney(original)}
                </Text>
              )}
              {onSale && (
                <Text className="text-[12px] font-bold text-chalk-red">
                  -{discountPercent(product)}%
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Link>
      <View className="border-t border-chalk-line px-2 py-1.5">
        <GoldButton
          className="items-center py-1.5"
          onPress={handleAdd}
          disabled={adding || product.stock === 0}
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="cart" size={13} color="#111111" />
            <Text className="ml-1 text-[12px] font-semibold text-[#111111]">
              {product.stock === 0 ? "Unavailable" : "Add to Cart"}
            </Text>
          </View>
        </GoldButton>
      </View>
      {onSale && (
        <View className="absolute left-2 top-2 rounded-full bg-chalk-red px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-white">
            -{discountPercent(product)}%
          </Text>
        </View>
      )}
      {product.stock === 0 && (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="close-circle" size={16} color="#fff" />
            <Text className="text-xs font-semibold text-white">Out of stock</Text>
          </View>
        </View>
      )}
    </View>
  );
}