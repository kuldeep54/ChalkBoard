import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { ordersAPI } from "../services/api";
import GoldButton from "../components/gold-button";
import {
  formatMoney,
  salePrice,
  toastSuccess,
  toastError,
  getErrorMessage,
} from "../utils/helpers";

export default function CheckoutScreen() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const handleCheckout = async () => {
    if (
      !address.street ||
      !address.city ||
      !address.state ||
      !address.zipCode ||
      !address.country
    ) {
      toastError("Missing details", "Please fill in all address fields");
      return;
    }

    setLoading(true);
    try {
      await ordersAPI.create(address);
      clearCart();
      toastSuccess("Order placed successfully");
      router.replace("/order-confirmation");
    } catch (err) {
      toastError("Checkout Failed", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "rounded-lg border border-chalk-line bg-white p-3.5 text-base";

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-chalk-mist"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="p-4 pb-10">
        <Text className="mb-3 text-lg font-semibold text-chalk-ink">Shipping Address</Text>
        <View className="mb-6 gap-3">
          <TextInput
            className={inputClass}
            placeholder="Street Address"
            value={address.street}
            onChangeText={(v) => setAddress({ ...address, street: v })}
          />
          <View className="flex-row gap-3">
            <TextInput
              className={`${inputClass} flex-1`}
              placeholder="City"
              value={address.city}
              onChangeText={(v) => setAddress({ ...address, city: v })}
            />
            <TextInput
              className={`${inputClass} flex-1`}
              placeholder="State"
              value={address.state}
              onChangeText={(v) => setAddress({ ...address, state: v })}
            />
          </View>
          <View className="flex-row gap-3">
            <TextInput
              className={`${inputClass} flex-1`}
              placeholder="ZIP Code"
              value={address.zipCode}
              onChangeText={(v) => setAddress({ ...address, zipCode: v })}
              keyboardType="numeric"
            />
            <TextInput
              className={`${inputClass} flex-1`}
              placeholder="Country"
              value={address.country}
              onChangeText={(v) => setAddress({ ...address, country: v })}
            />
          </View>
        </View>

        <Text className="mb-3 text-lg font-semibold text-chalk-ink">
          Order Summary
        </Text>
        <View className="mb-6 rounded-lg border border-chalk-line bg-white p-4">
          {cart.items.map((item, idx) => (
            <View
              key={item.product?._id ?? idx}
              className="mb-2 flex-row items-center justify-between"
            >
              <Text numberOfLines={1} className="mr-3 flex-1 text-sm text-chalk-slate">
                {item.product?.name} × {item.quantity}
              </Text>
              <Text className="text-sm font-medium text-chalk-ink">
                {formatMoney(salePrice(item.product) * item.quantity)}
              </Text>
            </View>
          ))}
          <View className="my-2 border-t border-chalk-line" />
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-chalk-ink">Total</Text>
            <Text className="text-xl font-bold text-chalk-ink">
              {formatMoney(cartTotal)}
            </Text>
          </View>
        </View>

        <GoldButton
          className="items-center p-4"
          onPress={handleCheckout}
          disabled={loading}
          loading={loading}
        >
          <Text className="text-lg font-bold text-[#111111]">Place Order</Text>
        </GoldButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}