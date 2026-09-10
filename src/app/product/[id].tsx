import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsAPI, Product } from "../../services/api";
import { useCart } from "../../context/CartContext";
import RatingStars from "../../components/rating-stars";
import ProductCard from "../../components/product-card";
import {
  formatMoney,
  salePrice,
  isOnSale,
  discountPercent,
  toastSuccess,
  toastError,
  getErrorMessage,
} from "../../utils/helpers";

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [related, setRelated] = useState<Product[]>([]);

  const fetchProduct = useCallback(async () => {
    try {
      const res = await productsAPI.getById(id);
      setProduct(res.data.product);
    } catch {
      toastError("Error", "Product not found");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (!product?._id) return;
    productsAPI
      .getRelated(product._id, { limit: 6 })
      .then((res) => setRelated(res.data.products))
      .catch(() => setRelated([]));
  }, [product?._id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    try {
      await addToCart(product._id, quantity);
      toastSuccess(`${quantity} × ${product.name} added`, "Tap to view cart", {
        onPress: () => router.push("/(tabs)/cart"),
      });
    } catch (err) {
      toastError("Failed to add to cart", getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (!product) return null;

  const images = product.images?.length ? product.images : [product.image];
  const price = salePrice(product);
  const onSale = isOnSale(product);

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ title: product.name }} />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="relative">
          <FlatList
            horizontal
            pagingEnabled
            data={images}
            keyExtractor={(item, index) => `${item}-${index}`}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width
              );
              setImageIndex(index);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                className="aspect-square w-screen bg-chalk-mist"
                resizeMode="cover"
              />
            )}
          />
          {onSale && (
            <View className="absolute left-4 top-4 rounded-full bg-chalk-red px-3 py-1">
              <Text className="text-xs font-bold text-white">
                {discountPercent(product)}% OFF
              </Text>
            </View>
          )}
          {images.length > 1 && (
            <View className="absolute bottom-3 left-0 right-0 flex-row justify-center gap-1.5">
              {images.map((img, index) => (
                <View
                  key={`${img}-dot-${index}`}
                  className={`h-2 rounded-full ${
                    index === imageIndex ? "w-5 bg-chalk-indigo" : "w-2 bg-white"
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        <View className="p-5">
          <View className="mb-3 flex-row items-center gap-3">
            <View className="rounded-full bg-chalk-mist px-3 py-1">
              <Text className="text-xs font-semibold text-chalk-indigo">
                {product.category}
              </Text>
            </View>
            <RatingStars rating={product.rating} size={14} showValue />
            <Text className="text-xs text-chalk-slate">
              {product.ratingCount || 0} ratings
            </Text>
          </View>

          <Text className="text-2xl font-bold text-chalk-ink">{product.name}</Text>

          <View className="mt-2 flex-row items-center gap-2">
            <Text className="text-3xl font-bold text-chalk-blue">
              {formatMoney(price)}
            </Text>
            {onSale && (
              <>
                <Text className="text-lg text-chalk-slate line-through">
                  {formatMoney(product.price)}
                </Text>
                <Text className="text-sm font-semibold text-chalk-green">
                  Save {formatMoney(product.price - price)}
                </Text>
              </>
            )}
          </View>

          <Text className="mt-4 text-[15px] leading-6 text-chalk-slate">
            {product.description}
          </Text>

          <View className="mt-4 flex-row items-center gap-2">
            <Ionicons
              name={product.stock > 0 ? "checkmark-circle" : "close-circle"}
              size={20}
              color={product.stock > 0 ? "#059669" : "#dc2626"}
            />
            <Text
              className={`text-sm font-medium ${
                product.stock > 0 ? "text-chalk-green" : "text-chalk-red"
              }`}
            >
              {product.stock > 0
                ? `${product.stock} in stock`
                : "Out of stock"}
            </Text>
          </View>

          {related.length > 0 && (
            <View className="mt-8">
              <Text className="mb-3 text-lg font-bold text-chalk-ink">
                You might also like
              </Text>
              <FlatList
                horizontal
                data={related}
                keyExtractor={(item) => item._id}
                showsHorizontalScrollIndicator={false}
                ItemSeparatorComponent={() => <View className="w-3" />}
                renderItem={({ item }) => <ProductCard product={item} width={150} />}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {product.stock > 0 && (
        <View className="flex-row items-center gap-3 border-t border-chalk-line bg-white px-4 pb-8 pt-3">
          <View className="flex-row items-center overflow-hidden rounded-xl border border-chalk-line">
            <TouchableOpacity
              className="h-11 w-11 items-center justify-center"
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Ionicons name="remove" size={20} color="#4f46e5" />
            </TouchableOpacity>
            <Text className="min-w-10 text-center text-lg font-semibold text-chalk-ink">
              {quantity}
            </Text>
            <TouchableOpacity
              className="h-11 w-11 items-center justify-center"
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
            >
              <Ionicons name="add" size={20} color="#4f46e5" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className={`flex-1 items-center rounded-xl bg-chalk-indigo p-3.5 ${
              adding ? "opacity-60" : ""
            }`}
            onPress={handleAddToCart}
            disabled={adding}
          >
            {adding ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-semibold text-white">
                Add to Cart · {formatMoney(price * quantity)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}