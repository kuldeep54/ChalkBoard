import React, { useEffect, useState } from "react";
import { View, Text, Animated, Easing } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [logoOpacity] = useState(() => new Animated.Value(0));
  const [logoScale] = useState(() => new Animated.Value(0.6));
  const [titleTranslate] = useState(() => new Animated.Value(24));
  const [titleOpacity] = useState(() => new Animated.Value(0));
  const [taglineOpacity] = useState(() => new Animated.Value(0));
  const [footerPulse] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(titleOpacity, {
      toValue: 1,
      duration: 500,
      delay: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(titleTranslate, {
      toValue: 0,
      duration: 500,
      delay: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    Animated.timing(taglineOpacity, {
      toValue: 1,
      duration: 450,
      delay: 600,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(footerPulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(footerPulse, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [logoOpacity, logoScale, titleTranslate, titleOpacity, taglineOpacity, footerPulse]);

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
      <Animated.View
        className="items-center"
        style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
      >
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
          <Ionicons name="flask" size={44} color="#fff" />
        </View>
      </Animated.View>
      <Animated.View
        style={{
          opacity: titleOpacity,
          transform: [{ translateY: titleTranslate }],
        }}
      >
        <Text className="text-5xl font-bold tracking-tight text-white">
          ChalkBoard
        </Text>
      </Animated.View>
      <Animated.View
        className="mt-2"
        style={{ opacity: taglineOpacity }}
      >
        <Text className="text-sm font-medium text-white/70">
          Shop the essentials you love
        </Text>
      </Animated.View>
      <Animated.View
        className="absolute bottom-16"
        style={{ opacity: footerPulse }}
      >
        <Text className="text-xs tracking-widest text-white/40">
          LOADING YOUR STORE
        </Text>
      </Animated.View>
    </View>
  );
}