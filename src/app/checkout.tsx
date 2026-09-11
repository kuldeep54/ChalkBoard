import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCart } from "../context/CartContext";
import { ordersAPI, Address } from "../services/api";
import GoldButton from "../components/gold-button";
import DeliveryAddressSheet from "../components/delivery-address-sheet";
import {
  formatMoney,
  salePrice,
  toastSuccess,
  toastError,
  getErrorMessage,
  isValidZipCode,
} from "../utils/helpers";

export default function CheckoutScreen() {
  const { cart, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string>();
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const hasAddress = address.street.trim().length > 0;

  const handleAddressSelect = (addr: Address) => {
    setSelectedAddressId(addr._id);
    setAddress({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
    });
  };

  const handleCheckout = async () => {
    if (!address.street.trim()) {
      toastError("Missing details", "Please select or enter a street address");
      return;
    }
    if (!address.city.trim()) {
      toastError("Missing details", "Please enter your city");
      return;
    }
    if (!isValidZipCode(address.zipCode)) {
      toastError("Invalid ZIP", "Please enter a valid ZIP / postal code (4-10 digits)");
      return;
    }
    if (!address.state.trim()) {
      toastError("Missing details", "Please enter your state");
      return;
    }
    if (!address.country.trim()) {
      toastError("Missing details", "Please enter your country");
      return;
    }

    setLoading(true);
    try {
      await ordersAPI.create(address);
      clearCart();
      toastSuccess("Order placed successfully");
      router.replace("/order-confirmation");
    } catch (err) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 401) {
        setRequiresLogin(true);
      } else {
        toastError("Checkout Failed", getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base";

  const labelClass = "mb-1 text-sm font-semibold text-chalk-ink";

  if (requiresLogin) {
    return (
      <View className="flex-1 items-center justify-center bg-chalk-mist p-6">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-chalk-indigo">
          <Ionicons name="lock-closed-outline" size={32} color="#fff" />
        </View>
        <Text className="mt-4 text-xl font-bold text-chalk-ink">Login required</Text>
        <Text className="mt-2 text-center text-sm text-chalk-slate">
          Please sign in to place your order and keep your cart synced.
        </Text>
        <GoldButton
          className="mt-6 w-full items-center p-4"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-base font-bold text-[#111111]">Sign In</Text>
        </GoldButton>
        <View className="mt-3 w-full items-center">
          <TouchableOpacity onPress={() => router.replace("/")}>
            <Text className="text-sm font-semibold text-chalk-blue">
              Continue browsing
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-chalk-mist"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="p-4 pb-10">
        {/* Deliver To picker */}
        <TouchableOpacity
          className="mb-4 flex-row items-center rounded-xl border border-chalk-blue/20 bg-chalk-blue/5 p-4"
          onPress={() => setSheetVisible(true)}
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-chalk-blue/10">
            <Ionicons name="location" size={20} color="#2563eb" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xs font-semibold text-chalk-blue">
              DELIVER TO
            </Text>
            {hasAddress ? (
              <Text className="mt-0.5 text-sm font-medium text-chalk-ink" numberOfLines={1}>
                {address.street}, {address.city}
              </Text>
            ) : (
              <Text className="mt-0.5 text-sm text-chalk-slate">
                Select delivery address
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#2563eb" />
        </TouchableOpacity>

        {/* Address form */}
        <Text className="mb-3 text-lg font-semibold text-chalk-ink">Shipping Address</Text>
        <View className="mb-6 gap-3">
          <Text className={labelClass}>Street Address</Text>
          <TextInput
            className={inputClass}
            placeholder="Enter street address"
            value={address.street}
            onChangeText={(v) => setAddress({ ...address, street: v })}
          />

          <Text className={labelClass}>City</Text>
          <TextInput
            className={inputClass}
            placeholder="Enter city"
            value={address.city}
            onChangeText={(v) => setAddress({ ...address, city: v })}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className={labelClass}>ZIP Code</Text>
              <TextInput
                className={inputClass}
                placeholder="e.g. 452001"
                value={address.zipCode}
                onChangeText={(v) => setAddress({ ...address, zipCode: v })}
                keyboardType="numeric"
              />
            </View>
            <View className="flex-1">
              <Text className={labelClass}>State</Text>
              <TextInput
                className={inputClass}
                placeholder="e.g. Madhya Pradesh"
                value={address.state}
                onChangeText={(v) => setAddress({ ...address, state: v })}
              />
            </View>
          </View>

          <Text className={labelClass}>Country</Text>
          <TextInput
            className={inputClass}
            placeholder="e.g. India"
            value={address.country}
            onChangeText={(v) => setAddress({ ...address, country: v })}
          />
        </View>

        <Text className="mb-3 text-lg font-semibold text-chalk-ink">
          Order Summary
        </Text>
        <View className="mb-6 rounded-xl border border-chalk-line bg-white p-4">
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

      <DeliveryAddressSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        onSelect={handleAddressSelect}
        selectedId={selectedAddressId}
      />
    </KeyboardAvoidingView>
  );
}
