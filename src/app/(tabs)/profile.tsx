import React, { useState, useEffect, ComponentProps } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useRouter } from "expo-router";
import { ordersAPI, Order } from "../../services/api";
import { formatMoney, toastInfo, toastSuccess } from "../../utils/helpers";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await ordersAPI.getAll();
      setOrders(res.data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    fetchOrders();
  }, []);

  const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          toastSuccess("Logged out", "See you soon!");
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-chalk-mist">
      <View className="items-center border-b border-chalk-line bg-white px-6 pb-6 pt-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-chalk-indigo">
          <Text className="text-3xl font-bold text-white">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <Text className="mt-4 text-xl font-semibold text-chalk-ink">
          {user?.name || "User"}
        </Text>
        <Text className="mt-1 text-sm text-chalk-slate">{user?.email || ""}</Text>
      </View>

      <View className="flex-row gap-3 p-4">
        <StatCard
          icon="receipt-outline"
          label="Orders"
          value={String(orders.length)}
          onPress={() => router.push("/(tabs)/orders")}
        />
        <StatCard
          icon="cart-outline"
          label="Cart Items"
          value={String(cartCount)}
          onPress={() => router.push("/(tabs)/cart")}
        />
        <StatCard
          icon="wallet-outline"
          label="Total Spent"
          value={formatMoney(totalSpent)}
        />
      </View>

      {loadingOrders ? (
        <ActivityIndicator color="#232F3E" className="py-6" />
      ) : orders.length > 0 ? (
        <View className="px-4">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-chalk-ink">Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/orders")}>
              <Text className="text-sm font-semibold text-chalk-blue">View all</Text>
            </TouchableOpacity>
          </View>
          {orders.slice(0, 3).map((order) => (
            <TouchableOpacity
              key={order._id}
              className="mb-2 flex-row items-center justify-between rounded-xl border border-chalk-line bg-white p-3.5"
              onPress={() => router.push("/(tabs)/orders")}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-lg bg-chalk-mist">
                  <Ionicons name="cube-outline" size={18} color="#232F3E" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-chalk-ink">
                    {order.items?.length || 0} item(s)
                  </Text>
                  <Text className="text-xs text-chalk-slate">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              </View>
              <Text className="text-base font-bold text-chalk-ink">
                {formatMoney(order.totalAmount)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View className="items-center px-4 py-6">
          <Text className="text-sm text-chalk-slate">
            No orders yet — start shopping!
          </Text>
        </View>
      )}

      <View className="mt-2 p-4">
        <MenuItem
          icon="help-circle-outline"
          label="Help & Support"
          onPress={() =>
            toastInfo("Help & Support", "Contact support@chalkboard.com")
          }
        />
        <MenuItem icon="log-out-outline" label="Logout" onPress={handleLogout} danger />
      </View>
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      className="flex-1 items-center rounded-xl border border-chalk-line bg-white p-3"
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon} size={22} color="#232F3E" />
      <Text className="mt-1.5 text-base font-bold text-chalk-ink">{value}</Text>
      <Text className="mt-0.5 text-xs text-chalk-slate">{label}</Text>
    </TouchableOpacity>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      className="mb-2 flex-row items-center rounded-xl border border-chalk-line bg-white p-4"
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={22}
        color={danger ? "#dc2626" : "#374151"}
      />
      <Text className={`ml-3 flex-1 text-base ${danger ? "text-chalk-red" : "text-chalk-ink"}`}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
    </TouchableOpacity>
  );
}