import React, { useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";

function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: object;
}) {
  const [opacity] = useState(() => new Animated.Value(0.35));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      className={`rounded-xl bg-chalk-slate/20 ${className ?? ""}`}
      style={[{ opacity }, style]}
    />
  );
}

export function ProductCardSkeleton({ width = 150 }: { width?: number }) {
  return (
    <View className="mr-3" style={{ width }}>
      <Skeleton className="aspect-square w-full" />
      <Skeleton className="mb-2 mt-2 h-3.5 w-4/5" />
      <Skeleton className="h-4 w-1/2" />
    </View>
  );
}

export function ProductGridSkeleton() {
  return (
    <View className="flex-row flex-wrap justify-between px-3">
      <View className="mb-3 w-[48%]">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="mb-2 mt-2 h-3.5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </View>
      <View className="mb-3 w-[48%]">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="mb-2 mt-2 h-3.5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </View>
      <View className="mb-3 w-[48%]">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="mb-2 mt-2 h-3.5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </View>
      <View className="mb-3 w-[48%]">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="mb-2 mt-2 h-3.5 w-4/5" />
        <Skeleton className="h-4 w-1/2" />
      </View>
    </View>
  );
}

export function HomeScreenSkeleton() {
  return (
    <View className="flex-1 bg-chalk-mist">
      <Skeleton className="mx-4 mt-4 h-44 rounded-2xl" />
      <Skeleton className="mx-4 mt-4 h-12" />
      <View className="mt-5 flex-row justify-between px-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} className="items-center">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <Skeleton className="mt-1.5 h-2.5 w-12" />
          </View>
        ))}
      </View>
      <Skeleton className="mx-4 mt-6 h-4 w-28" />
      <View className="mt-3 flex-row pl-4">
        {[0, 1].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </View>
      <Skeleton className="mx-4 mt-7 h-4 w-32" />
      <View className="mt-3 flex-row pl-4">
        {[0, 1].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
}

export function ProductDetailSkeleton() {
  return (
    <View className="flex-1 bg-white">
      <Skeleton className="aspect-square w-full rounded-none" />
      <View className="p-5">
        <Skeleton className="w-24" />
        <Skeleton className="mb-3 mt-3 h-6 w-3/4" />
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mb-3 mt-4 h-3.5 w-full" />
        <Skeleton className="mb-2 h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
      </View>
    </View>
  );
}