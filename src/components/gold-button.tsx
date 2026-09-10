import React from "react";
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type TouchableOpacityProps,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function GoldButton({
  children,
  loading,
  disabled,
  className,
  ...rest
}: TouchableOpacityProps & { loading?: boolean }) {
  return (
    <TouchableOpacity
      {...rest}
      disabled={disabled || loading}
      activeOpacity={0.85}
      className={`overflow-hidden rounded-lg border border-chalk-goldedge ${
        disabled || loading ? "opacity-60" : ""
      } ${className ?? ""}`}
    >
      <LinearGradient
        colors={["#F7DFA5", "#F0C14B"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View className="w-full items-center justify-center">
        {loading ? <ActivityIndicator color="#111111" /> : children}
      </View>
    </TouchableOpacity>
  );
}