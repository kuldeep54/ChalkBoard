import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import RatingStars from "./rating-stars";
import type { Product } from "../services/api";
import {
  formatMoney,
  salePrice,
  isOnSale,
  productImage,
  discountPercent,
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

  if (variant === "list") {
    return (
      <Link href={`/product/${product._id}`} asChild>
        <TouchableOpacity className="mb-3 flex-row overflow-hidden rounded-xl border border-chalk-line bg-white">
          <Image
            source={{ uri: image }}
            className="h-24 w-24 bg-chalk-mist"
            resizeMode="cover"
          />
          <View className="flex-1 justify-center p-3">
            <Text numberOfLines={1} className="text-sm font-semibold text-chalk-ink">
              {product.name}
            </Text>
            <Text className="mt-0.5 text-xs text-chalk-slate">{product.category}</Text>
            <View className="mt-1">
              <RatingStars rating={product.rating} size={12} />
            </View>
            <View className="mt-1.5 flex-row items-center gap-2">
              <Text className="text-base font-bold text-chalk-blue">
                {formatMoney(price)}
              </Text>
              {onSale && (
                <Text className="text-xs text-chalk-slate line-through">
                  {formatMoney(original)}
                </Text>
              )}
            </View>
          </View>
          {onSale && (
            <View className="absolute left-0 top-2 rounded-r-full bg-chalk-red px-2 py-0.5">
              <Text className="text-[10px] font-bold text-white">
                -{discountPercent(product)}%
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Link>
    );
  }

  const cardWidth = width || "flex-1";

  return (
    <Link href={`/product/${product._id}`} asChild>
      <TouchableOpacity
        className="overflow-hidden rounded-xl border border-chalk-line bg-white"
        style={{ width: cardWidth === "flex-1" ? undefined : cardWidth }}
      >
        <Image
          source={{ uri: image }}
          className="aspect-square w-full bg-chalk-mist"
          resizeMode="cover"
        />
        <View className="p-2.5">
          <Text numberOfLines={1} className="text-sm font-semibold text-chalk-ink">
            {product.name}
          </Text>
          <View className="mt-1">
            <RatingStars rating={product.rating} size={11} />
          </View>
          <View className="mt-1.5 flex-row items-center gap-1.5">
            <Text className="text-base font-bold text-chalk-blue">
              {formatMoney(price)}
            </Text>
            {onSale && (
              <Text className="text-xs text-chalk-slate line-through">
                {formatMoney(original)}
              </Text>
            )}
          </View>
        </View>
        {onSale && (
          <View className="absolute left-2 top-2 rounded-full bg-chalk-red px-2 py-0.5">
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
      </TouchableOpacity>
    </Link>
  );
}