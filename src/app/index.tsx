import React, { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      router.replace(isAuthenticated ? "/(tabs)/home" : "/(auth)/login");
    }, 1400);
    return () => clearTimeout(timer);
  }, [loading, isAuthenticated, router]);

  return (
    <View className="flex-1 items-center justify-center bg-chalk-indigo">
      <Ionicons
        name="sparkles"
        size={160}
        color="rgba(255,255,255,0.10)"
        style={{ position: "absolute", top: -20, right: -20 }}
      />
      <View className="items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
          <Ionicons name="flask" size={44} color="#fff" />
        </View>
        <Text className="text-5xl font-bold tracking-tight text-white">
          ChalkBoard
        </Text>
        <Text className="mt-2 text-sm font-medium text-white/70">
          Shop the essentials you love
        </Text>
      </View>
      <View className="absolute bottom-16">
        <Text className="text-xs tracking-widest text-white/40">
          LOADING YOUR STORE
        </Text>
      </View>
    </View>
  );
}