import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function RatingStars({
  rating = 0,
  size = 14,
  color = "#FFA41C",
  showValue = false,
}) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const name =
      rating >= i
        ? "star"
        : rating >= i - 0.5
          ? "star-half"
          : "star-outline";
    stars.push(
      <Ionicons key={i} name={name} size={size} color={color} />
    );
  }

  if (!showValue) {
    return <View className="flex-row items-center" style={{ gap: 1 }}>{stars}</View>;
  }

  return (
    <View className="flex-row items-center gap-1">
      {stars}
      <Text className="ml-1 text-xs font-semibold text-chalk-ink">
        {rating.toFixed(1)}
      </Text>
    </View>
  );
}