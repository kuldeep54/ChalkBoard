import React, { useState, useEffect, useCallback, ComponentProps } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsAPI, Product } from "../../services/api";
import ProductCard from "../../components/product-card";
import { toastError, getErrorMessage } from "../../utils/helpers";

type IconName = ComponentProps<typeof Ionicons>["name"];

const CATEGORIES: { name: string; icon: IconName }[] = [
  { name: "Electronics", icon: "phone-portrait-outline" },
  { name: "Clothing", icon: "shirt-outline" },
  { name: "Books", icon: "book-outline" },
  { name: "Home", icon: "home-outline" },
  { name: "Sports", icon: "basketball-outline" },
  { name: "Beauty", icon: "sparkles-outline" },
  { name: "Toys", icon: "gift-outline" },
];

const SECTION_KEYS = ["hero", "search", "categories", "featured", "trending", "offers"];

export default function HomeScreen() {
  const router = useRouter();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [trending, setTrending] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      const [f, t, o] = await Promise.all([
        productsAPI.getAll({ featured: true, limit: 10 }),
        productsAPI.getAll({ trending: true, limit: 10 }),
        productsAPI.getAll({ discount: true, limit: 10 }),
      ]);
      setFeatured(f.data.products);
      setTrending(t.data.products);
      setOffers(o.data.products);
    } catch (err) {
      toastError("Couldn't load home", getErrorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on mount
    fetchAll();
  }, [fetchAll]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll(true);
  };

  const submitSearch = () => {
    router.push({ pathname: "/catalog", params: { search } });
    setSearch("");
  };

  const renderSection = ({ item }: { item: string }) => {
    switch (item) {
      case "hero":
        return <HeroBanner />;
      case "search":
        return (
          <View className="px-4 pb-2">
            <View className="flex-row items-center rounded-xl border border-chalk-line bg-white px-3">
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 p-3 text-base"
                placeholder="Search products..."
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
                onSubmitEditing={submitSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      case "categories":
        return <CategoryRow />;
      case "featured":
        return (
          <ProductSlider
            title="Featured"
            subtitle="Handpicked for you"
            icon="star"
            tag="featured"
            products={featured}
            empty="No featured products yet"
          />
        );
      case "trending":
        return (
          <ProductSlider
            title="Trending Now"
            subtitle="What everyone's loving"
            icon="flame"
            tag="trending"
            products={trending}
            empty="No trending products yet"
          />
        );
      case "offers":
        return (
          <ProductSlider
            title="Special Offers"
            subtitle="Deals you can't miss"
            icon="pricetag"
            tag="discount"
            products={offers}
            empty="No offers right now"
          />
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex-1 bg-chalk-mist">
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={SECTION_KEYS}
          keyExtractor={(item) => item}
          renderItem={renderSection}
          contentContainerClassName="pb-6"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}

function HeroBanner() {
  const router = useRouter();
  return (
    <View className="mx-4 mt-4 overflow-hidden rounded-2xl bg-chalk-indigo p-6">
      <Ionicons
        name="sparkles"
        size={90}
        color="rgba(255,255,255,0.12)"
        style={{ position: "absolute", right: -10, top: -12 }}
      />
      <Text className="text-sm font-semibold uppercase tracking-widest text-chalk-accent">
        New Season
      </Text>
      <Text className="mt-1 text-2xl font-bold text-white">
        Fresh picks,{`\n`}only on ChalkBoard
      </Text>
      <Text className="mt-2 text-sm text-white/80">
        Explore curated essentials across seven categories.
      </Text>
      <TouchableOpacity
        className="mt-4 self-start rounded-full bg-white px-5 py-2.5"
        onPress={() => router.push({ pathname: "/catalog", params: { tag: "featured" } })}
      >
        <Text className="text-sm font-bold text-chalk-indigo">Shop Now</Text>
      </TouchableOpacity>
    </View>
  );
}

function CategoryRow() {
  const router = useRouter();
  return (
    <View className="mt-4">
      <View className="mb-3 flex-row items-center justify-between px-4">
        <Text className="text-lg font-bold text-chalk-ink">Categories</Text>
        <Link href="/catalog" className="text-sm font-semibold text-chalk-blue">
          Shop All
        </Link>
      </View>
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.name}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mr-3 w-16 items-center"
            onPress={() =>
              router.push({ pathname: "/catalog", params: { category: item.name } })
            }
          >
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
              <Ionicons name={item.icon} size={26} color="#4f46e5" />
            </View>
            <Text numberOfLines={1} className="mt-1.5 text-xs font-medium text-chalk-ink">
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function ProductSlider({
  title,
  subtitle,
  icon,
  tag,
  products,
  empty,
}: {
  title: string;
  subtitle: string;
  icon: IconName;
  tag: string;
  products: Product[];
  empty: string;
}) {
  const router = useRouter();
  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between px-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name={icon} size={18} color="#4f46e5" />
          <View>
            <Text className="text-lg font-bold text-chalk-ink">{title}</Text>
            <Text className="text-xs text-chalk-slate">{subtitle}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() =>
            router.push({ pathname: "/catalog", params: { tag } })
          }
        >
          <Text className="text-sm font-semibold text-chalk-blue">See all</Text>
        </TouchableOpacity>
      </View>
      {products.length === 0 ? (
        <Text className="px-4 text-sm text-chalk-slate">{empty}</Text>
      ) : (
        <FlatList
          horizontal
          data={products}
          keyExtractor={(item) => item._id}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-4"
          ItemSeparatorComponent={() => <View className="w-3" />}
          renderItem={({ item }) => <ProductCard product={item} width={150} />}
        />
      )}
    </View>
  );
}