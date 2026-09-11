import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import "../global.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="auto" />
        <Stack initialRouteName="index" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="product/[id]"
            options={{
              headerShown: true,
              title: "Product Detail",
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="catalog"
            options={{
              headerShown: true,
              title: "Products",
              presentation: "card",
            }}
          />
          <Stack.Screen
            name="checkout"
            options={{
              headerShown: true,
              title: "Checkout",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="order-confirmation"
            options={{
              headerShown: false,
              presentation: "modal",
            }}
          />
        </Stack>
        <Toast />
      </CartProvider>
    </AuthProvider>
  );
}
