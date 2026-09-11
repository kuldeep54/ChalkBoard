import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ordersAPI, Order } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import GoldButton from "../../components/gold-button";
import { toastInfo } from "../../utils/helpers";

export default function OrdersScreen() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await ordersAPI.getAll();
      setOrders(res.data.orders);
    } catch (err) {
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    fetchOrders();
  }, [isAuthenticated]);

  // Login gate for guests — order history is account-only.
  if (!isAuthenticated) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={80} color="#d1d5db" />
        <Text style={styles.emptyTitle}>Your orders live behind login</Text>
        <Text style={styles.emptySubtitle}>
          Sign in to view your order history.
        </Text>
        <GoldButton
          className="mt-6 w-56 items-center p-4"
          onPress={() => {
            toastInfo("Login required", "Sign in to view your orders");
            router.push("/(auth)/login");
          }}
        >
          <Text className="text-base font-bold text-[#111111]">Sign In</Text>
        </GoldButton>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "placed": return "#2563eb";
      case "shipped": return "#f59e0b";
      case "delivered": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
          Your order history will appear here
        </Text>
      </View>
    );
  }

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "20" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
      </View>
      <View style={styles.itemsList}>
        {item.items.map((orderItem, idx) => (
          <View
            key={orderItem.product ?? `${orderItem.name}-${idx}`}
            style={styles.orderItem}
          >
            <Text style={styles.itemName} numberOfLines={1}>
              {orderItem.name} x{orderItem.quantity}
            </Text>
            <Text style={styles.itemPrice}>
              ${(orderItem.price * orderItem.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalAmount}>${item.totalAmount.toFixed(2)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  list: { padding: 16 },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderDate: { fontSize: 14, color: "#6b7280" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600" },
  itemsList: { gap: 8 },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: { fontSize: 14, color: "#374151", flex: 1, marginRight: 12 },
  itemPrice: { fontSize: 14, fontWeight: "500", color: "#111827" },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    marginTop: 12,
    paddingTop: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: "600", color: "#374151" },
  totalAmount: { fontSize: 16, fontWeight: "bold", color: "#2563eb" },
});
