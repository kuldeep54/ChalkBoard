import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../../context/CartContext";
import { useRouter } from "expo-router";
import GoldButton from "../../components/gold-button";
import type { CartItem } from "../../services/api";
import {
  formatMoney,
  salePrice,
  productImage,
  toastInfo,
  toastError,
  getErrorMessage,
} from "../../utils/helpers";

export default function CartScreen() {
  const { cart, loading, updateQuantity, removeFromCart, cartTotal } = useCart();
  const router = useRouter();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-chalk-mist">
        <ActivityIndicator size="large" color="#232F3E" />
      </View>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-chalk-mist">
        <Ionicons name="cart-outline" size={80} color="#d1d5db" />
        <Text className="mt-4 text-lg font-semibold text-chalk-ink">
          Your cart is empty
        </Text>
        <Text className="mt-1 text-sm text-chalk-slate">
          Add some products to get started
        </Text>
      </View>
    );
  }

  const handleRemove = async (item: CartItem) => {
    const name = item.product?.name || "Item";
    try {
      await removeFromCart(item.product?._id || "");
      toastInfo(`${name} removed from cart`);
    } catch (err) {
      toastError("Couldn't remove item", getErrorMessage(err));
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const stock = item.product?.stock ?? Infinity;
    return (
      <View className="mb-3 flex-row items-center rounded-lg border border-chalk-line bg-white p-3">
        <Image
          source={{ uri: productImage(item.product) ?? undefined }}
          className="h-20 w-20 rounded-lg bg-chalk-mist"
          resizeMode="cover"
        />
        <View className="ml-3 flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold text-chalk-ink">
            {item.product?.name}
          </Text>
          <Text className="mt-1 text-base font-bold text-chalk-ink">
            {formatMoney(salePrice(item.product))}
          </Text>
          <Text className="mt-0.5 text-[11px] text-chalk-tertiary">
            FREE Delivery · COD available
          </Text>
          <View className="mt-2 flex-row items-center gap-3">
            <TouchableOpacity
              className="h-8 w-8 items-center justify-center rounded-lg border border-chalk-line"
              onPress={() => {
                if (item.quantity <= 1) {
                  handleRemove(item);
                } else {
                  updateQuantity(item.product?._id || "", item.quantity - 1);
                }
              }}
            >
              <Ionicons name="remove" size={16} color="#232F3E" />
            </TouchableOpacity>
            <Text className="min-w-5 text-center text-base font-semibold text-chalk-ink">
              {item.quantity}
            </Text>
            <TouchableOpacity
              className="h-8 w-8 items-center justify-center rounded-lg border border-chalk-line"
              onPress={() =>
                updateQuantity(item.product?._id || "", Math.min(stock, item.quantity + 1))
              }
            >
              <Ionicons name="add" size={16} color="#232F3E" />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity className="p-2" onPress={() => handleRemove(item)}>
          <Ionicons name="trash-outline" size={20} color="#CC0C39" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-chalk-mist">
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.product?._id || item._id || ""}
        renderItem={renderCartItem}
        contentContainerClassName="p-4 pb-2"
        showsVerticalScrollIndicator={false}
      />
      <View className="border-t border-chalk-line bg-white px-4 pb-8 pt-3">
        <View className="mb-1 flex-row items-center gap-1.5">
          <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
          <Text className="text-xs text-chalk-tertiary">
            FREE Delivery on orders over $35
          </Text>
        </View>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-chalk-ink">Total:</Text>
          <Text className="text-xl font-bold text-chalk-ink">
            {formatMoney(cartTotal)}
          </Text>
        </View>
        <GoldButton className="items-center p-4" onPress={() => router.push("/checkout")}>
          <Text className="text-base font-bold text-[#111111]">
            Proceed to Checkout
          </Text>
        </GoldButton>
      </View>
    </View>
  );
}