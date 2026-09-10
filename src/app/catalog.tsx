import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { productsAPI, QueryParams, Product } from "../services/api";
import ProductCard from "../components/product-card";
import { ProductGridSkeleton } from "../components/skeletons";
import { toastInfo, toastError, getErrorMessage } from "../utils/helpers";

const PAGE_SIZE = 20;

const CATEGORIES = [
  "All",
  "Electronics",
  "Clothing",
  "Books",
  "Home",
  "Sports",
  "Beauty",
  "Toys",
];

const SORTS = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "priceAsc", label: "Price: Low to High" },
  { key: "priceDesc", label: "Price: High to Low" },
  { key: "rating", label: "Top Rated" },
];

export default function CatalogScreen() {
  const params = useLocalSearchParams();

  const [viewMode, setViewMode] = useState("grid");
  const [search, setSearch] = useState(typeof params.search === "string" ? params.search : "");
  const [selectedCategory, setSelectedCategory] = useState(
    typeof params.category === "string" ? params.category : "All"
  );
  const [activeTag, setActiveTag] = useState(
    typeof params.tag === "string" && ["featured", "trending", "discount"].includes(params.tag)
      ? params.tag
      : null
  );
  const [sort, setSort] = useState(SORTS[0].key);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const title =
    activeTag === "featured"
      ? "Featured"
      : activeTag === "trending"
        ? "Trending"
        : activeTag === "discount"
          ? "Special Offers"
          : selectedCategory === "All"
            ? "All Products"
            : selectedCategory;

  const searchRef = useRef(search);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const buildParams = useCallback(
    (pageNum: number): QueryParams => {
      const p: QueryParams = { page: pageNum, limit: PAGE_SIZE, sort };
      if (activeTag === "featured") p.featured = true;
      else if (activeTag === "trending") p.trending = true;
      else if (activeTag === "discount") p.discount = true;
      if (selectedCategory !== "All") p.category = selectedCategory;
      if (searchRef.current) p.search = searchRef.current;
      return p;
    },
    [activeTag, selectedCategory, sort]
  );

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      try {
        const res = await productsAPI.getAll(buildParams(pageNum));
        const newProducts = res.data.products;
        setProducts((prev) =>
          replace ? newProducts : [...prev, ...newProducts]
        );
        setHasMore(
          res.data.pagination?.hasMore ?? newProducts.length === PAGE_SIZE
        );
        if (replace) setPage(pageNum);
      } catch (err) {
        toastError("Couldn't load products", getErrorMessage(err));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildParams]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch on filter change
    fetchPage(1, true);
  }, [activeTag, selectedCategory, sort, fetchPage]);

  useEffect(() => {
    debounceRef.current && clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPage(1, true);
    }, 500);
    return () => {
      debounceRef.current && clearTimeout(debounceRef.current);
    };
  }, [search, fetchPage]);

  const onEndReached = () => {
    if (!hasMore || loadingMore || loading) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next, false);
  };

  const numColumns = viewMode === "grid" ? 2 : 1;
  const columnWrapperStyle = viewMode === "grid" ? { gap: 8, paddingHorizontal: 12 } : undefined;

  return (
    <View className="flex-1 bg-chalk-mist">
      <Stack.Screen options={{ title }} />

      <View className="gap-2 p-3">
        <View className="flex-row items-center rounded-lg border border-chalk-line bg-white px-3">
            <Ionicons name="search" size={20} color="#767676" />
            <TextInput
              className="flex-1 p-3 text-[15px]"
              placeholder="Search ChalkBoard"
              placeholderTextColor="#767676"
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={20} color="#767676" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="ml-2 rounded-md bg-chalk-gold px-3 py-2"
              onPress={() => fetchPage(1, true)}
            >
              <Ionicons name="search" size={18} color="#111111" />
            </TouchableOpacity>
          </View>

        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`mr-2 rounded-full border px-4 py-2 ${
                selectedCategory === item
                  ? "border-chalk-indigo bg-chalk-indigo"
                  : "border-chalk-line bg-white"
              }`}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedCategory === item ? "text-white" : "text-chalk-slate"
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />

        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-2">
            {SORTS.map((s) => (
              <TouchableOpacity
                key={s.key}
                className={`rounded-lg border px-3 py-1.5 ${
                  sort === s.key
                    ? "border-chalk-indigo bg-white"
                    : "border-chalk-line bg-white"
                }`}
                onPress={() => setSort(s.key)}
              >
                <Text
                  className={`text-xs font-medium ${
                    sort === s.key ? "text-chalk-indigo" : "text-chalk-slate"
                  }`}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View className="flex-row rounded-lg border border-chalk-line bg-white">
            <TouchableOpacity
              className={`rounded-l-lg p-2 ${viewMode === "grid" ? "bg-chalk-indigo" : ""}`}
              onPress={() => setViewMode("grid")}
            >
              <Ionicons
                name="grid"
                size={18}
                color={viewMode === "grid" ? "#fff" : "#9ca3af"}
              />
            </TouchableOpacity>
            <TouchableOpacity
              className={`rounded-r-lg p-2 ${viewMode === "list" ? "bg-chalk-indigo" : ""}`}
              onPress={() => setViewMode("list")}
            >
              <Ionicons
                name="list"
                size={18}
                color={viewMode === "list" ? "#fff" : "#9ca3af"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 pt-2">
          <ProductGridSkeleton />
        </View>
      ) : products.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Ionicons name="search-outline" size={64} color="#d1d5db" />
          <Text className="mt-3 text-base text-chalk-slate">No products found</Text>
          <TouchableOpacity
            className="mt-3 rounded-lg bg-chalk-navy2 px-5 py-2"
            onPress={() => {
              toastInfo("Filters reset");
              setSearch("");
              setSelectedCategory("All");
              setActiveTag(null);
              setSort(SORTS[0].key);
            }}
          >
            <Text className="text-sm font-semibold text-white">Reset Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={products}
          keyExtractor={(item) => item._id}
          numColumns={numColumns}
          columnWrapperStyle={columnWrapperStyle}
          contentContainerClassName={viewMode === "grid" ? "pb-4 pt-1" : "pb-4 px-3 pt-1"}
          showsVerticalScrollIndicator={false}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator size="small" color="#232F3E" className="py-4" />
            ) : hasMore ? (
              <TouchableOpacity
                className="my-4 items-center py-2"
                onPress={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchPage(next, false);
                }}
              >
                <Text className="text-sm font-semibold text-chalk-blue">Load more</Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) =>
            viewMode === "list" ? (
              <ProductCard product={item} variant="list" />
            ) : (
              <ProductCard product={item} />
            )
          }
        />
      )}
    </View>
  );
}