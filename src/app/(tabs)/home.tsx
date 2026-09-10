import React, { useState, useEffect, useCallback, ComponentProps } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsAPI, Product } from "../../services/api";
import ProductCard from "../../components/product-card";
import GoldButton from "../../components/gold-button";
import { HomeScreenSkeleton } from "../../components/skeletons";
import { toastError, getErrorMessage } from "../../utils/helpers";

type IconName = ComponentProps<typeof Ionicons>["name"];

const CATEGORIES: { name: string; icon: IconName }[] = [
  { name: "All", icon: "grid-outline" },
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
<View className="flex-row items-center rounded-lg border border-chalk-line bg-white px-3">
            <Ionicons name="search" size={20} color="#767676" />
            <TextInput
              className="flex-1 p-3 text-[15px]"
              placeholder="Search ChalkBoard"
              placeholderTextColor="#767676"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={submitSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#767676" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="ml-2 rounded-md bg-chalk-gold px-3 py-2"
              onPress={submitSearch}
            >
              <Ionicons name="search" size={18} color="#111111" />
            </TouchableOpacity>
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
        <HomeScreenSkeleton />
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
    <View className="mx-4 mt-2 overflow-hidden rounded-lg bg-chalk-navy2 p-5">
      <Ionicons
        name="sparkles"
        size={90}
        color="rgba(255,255,255,0.10)"
        style={{ position: "absolute", right: -10, top: -12 }}
      />
      <Text className="text-sm font-bold uppercase tracking-widest text-chalk-accent">
        New Season · Fresh Arrivals
      </Text>
      <Text className="mt-1 text-2xl font-bold text-white">
        Fresh picks,{`\n`}only on ChalkBoard
      </Text>
      <Text className="mt-2 text-sm text-white/85">
        Explore curated essentials across seven categories.
      </Text>
<GoldButton
        className="mt-4 self-start px-5 py-2.5"
        onPress={() => router.push({ pathname: "/catalog", params: { tag: "featured" } })}
      >
        <Text className="text-sm font-bold text-[#111111]">Shop Now</Text>
      </GoldButton>

      <View className="mt-4 flex-row items-center gap-1.5 border-t border-white/15 pt-3">
        <Ionicons name="checkmark-circle" size={15} color="#F0C14B" />
        <Text className="text-xs text-white/85">
          Fast & FREE Delivery · Cash on Delivery available
        </Text>
      </View>
    </View>
  );
}

function CategoryRow() {
  const router = useRouter();
  return (
    <View className="mt-3 border-t border-chalk-navline bg-chalk-navy">
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item.name}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 py-2"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="mr-2 rounded-md border border-transparent px-3 py-1.5"
            onPress={() =>
              router.push({
                pathname: "/catalog",
                params: item.name === "All" ? {} : { category: item.name },
              })
            }
          >
            <Text className="text-[13px] font-medium text-white">{item.name}</Text>
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
          <Ionicons name={icon} size={18} color="#232F3E" />
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