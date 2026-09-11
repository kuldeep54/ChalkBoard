import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { addressAPI, Address } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toastSuccess, toastError, isValidZipCode } from "../utils/helpers";
import GoldButton from "./gold-button";

const SCREEN_HEIGHT = Dimensions.get("window").height;

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (address: Address) => void;
  selectedId?: string;
}

export default function DeliveryAddressSheet({
  visible,
  onClose,
  onSelect,
  selectedId,
}: Props) {
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Address[]>([]);
  const [searching, setSearching] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  const openSheet = useCallback(() => {
    translateY.setValue(SCREEN_HEIGHT);
    Animated.spring(translateY, {
      toValue: 0,
      damping: 30,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const closeSheet = useCallback(
    (cb?: () => void) => {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => cb?.());
    },
    [translateY]
  );

  useEffect(() => {
    if (visible) {
      openSheet();
      if (isAuthenticated) fetchAddresses();
    }
  }, [visible, isAuthenticated]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressAPI.getAll();
      setAddresses(res.data.addresses);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  };

  // Geocode search — debounce 500ms, forward geocode + reverse for address details
  useEffect(() => {
    if (!visible) return;
    const q = search.trim();
    if (q.length < 3) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const coords = await Location.geocodeAsync(q);
        const top = coords.slice(0, 5);
        const results: Address[] = [];
        for (const c of top) {
          const [place] = await Location.reverseGeocodeAsync({
            latitude: c.latitude,
            longitude: c.longitude,
          });
          if (!place) continue;
          const street =
            [place.name, place.streetNumber, place.street]
              .filter(Boolean)
              .join(" ") || place.subregion || q;
          results.push({
            _id: `search-${results.length}`,
            label: "Search Result",
            street,
            city: place.city || place.district || "",
            state: place.region || "",
            zipCode: place.postalCode || "",
            country: place.country || "",
            isDefault: false,
          });
        }
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search, visible]);

  const handleSelect = (addr: Address) => {
    onSelect(addr);
    closeSheet(onClose);
  };

  const handleUseLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLoading(false);
        Alert.alert(
          "Location permission needed",
          "Please enable location access in Settings to use this feature.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (!place) {
        toastError("Error", "Could not determine your address");
        setLocationLoading(false);
        return;
      }

      const street = [place.name, place.street].filter(Boolean).join(", ") || place.formattedAddress || "Unknown street";
      const city = place.city || place.subregion || place.district || "Unknown city";
      const state = place.region || "Unknown state";
      const zipCode = place.postalCode || "000000";
      const country = place.country || "India";

      onSelect({
        _id: "current",
        label: "Current Location",
        street,
        city,
        state,
        zipCode,
        country,
        isDefault: false,
      });
      closeSheet(onClose);
    } catch {
      toastError("Error", "Failed to get your location. Try again.");
    } finally {
      setLocationLoading(false);
    }
  };

  const isSearching = search.trim().length >= 3;
  const showSearchResults = isSearching && searchResults.length > 0;
  const filtered = !isSearching
    ? addresses
    : addresses.filter(
        (a) =>
          `${a.label} ${a.street} ${a.city} ${a.state} ${a.zipCode} ${a.country}`
            .toLowerCase()
            .includes(search.toLowerCase())
      );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => closeSheet(onClose)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => closeSheet(onClose)}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: SCREEN_HEIGHT * 0.85,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: "#fff",
            transform: [{ translateY }],
          }}
        >
          <TouchableOpacity activeOpacity={1}>
            {/* Handle */}
            <View className="items-center pt-3 pb-2">
              <View className="h-1 w-10 rounded-full bg-chalk-line" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-chalk-line px-4 pb-3">
              <Text className="text-lg font-bold text-chalk-ink">
                Delivery Address
              </Text>
              <TouchableOpacity onPress={() => closeSheet(onClose)}>
                <Ionicons name="close-circle" size={28} color="#CBD5E1" />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: SCREEN_HEIGHT * 0.7 }}
            >
              {/* Search */}
              <View className="mx-4 mt-4 flex-row items-center rounded-xl border border-chalk-line bg-chalk-mist px-3">
                <Ionicons name="search" size={20} color="#94A3B8" />
                <TextInput
                  className="ml-2 flex-1 py-3 text-base"
                  placeholder="Search address..."
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Use Current Location */}
              <TouchableOpacity
                className="mx-4 mt-4 flex-row items-center rounded-xl border border-chalk-blue/30 bg-chalk-blue/5 p-4"
                onPress={handleUseLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#2563eb" />
                ) : (
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-chalk-blue/10">
                    <Ionicons name="location" size={20} color="#2563eb" />
                  </View>
                )}
                <View className="ml-3 flex-1">
                  <Text className="text-sm font-bold text-chalk-blue">
                    Use Current Location
                  </Text>
                  <Text className="text-xs text-chalk-slate">
                    Auto-detect your delivery address
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#2563eb" />
              </TouchableOpacity>

              {/* Search Results from geocoding */}
              {isSearching && (
                <View className="mt-4 px-4">
                  <Text className="mb-2 text-sm font-semibold text-chalk-slate">
                    SEARCH RESULTS
                  </Text>
                  {searching ? (
                    <ActivityIndicator className="py-4" size="small" color="#2563eb" />
                  ) : showSearchResults ? (
                    searchResults.map((r) => (
                      <TouchableOpacity
                        key={r._id}
                        className="mb-2 flex-row items-center rounded-xl border border-chalk-line bg-white p-4"
                        onPress={() => handleSelect(r)}
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-chalk-blue/10">
                          <Ionicons name="location-outline" size={20} color="#2563eb" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-sm font-bold text-chalk-ink" numberOfLines={1}>
                            {r.street}
                          </Text>
                          <Text className="text-xs text-chalk-slate" numberOfLines={1}>
                            {[r.city, r.state, r.zipCode].filter(Boolean).join(", ")}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <View className="items-center py-4">
                      <Ionicons name="search-outline" size={32} color="#CBD5E1" />
                      <Text className="mt-1 text-xs text-chalk-slate">
                        No results for &quot;{search}&quot;
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Saved Addresses */}
              {isAuthenticated && (
                <View className="mt-4 px-4">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm font-semibold text-chalk-slate">
                      SAVED ADDRESSES
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAddForm(!showAddForm)}
                    >
                      <Text className="text-sm font-bold text-chalk-blue">
                        + Add New
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {loading ? (
                    <ActivityIndicator
                      className="py-6"
                      size="small"
                      color="#F0C14B"
                    />
                  ) : filtered.length === 0 ? (
                    <View className="items-center py-6">
                      <Ionicons
                        name="location-outline"
                        size={48}
                        color="#CBD5E1"
                      />
                      <Text className="mt-2 text-sm text-chalk-slate">
                        {search ? "No matching addresses" : "No saved addresses"}
                      </Text>
                    </View>
                  ) : (
                    filtered.map((addr) => (
                      <TouchableOpacity
                        key={addr._id}
                        className={`mb-3 rounded-xl border p-4 ${
                          selectedId === addr._id
                            ? "border-chalk-blue bg-chalk-blue/5"
                            : "border-chalk-line bg-white"
                        }`}
                        onPress={() => handleSelect(addr)}
                      >
                        <View className="flex-row items-start">
                          <View
                            className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2 ${
                              selectedId === addr._id
                                ? "border-chalk-blue"
                                : "border-chalk-line"
                            }`}
                          >
                            {selectedId === addr._id && (
                              <View className="h-2.5 w-2.5 rounded-full bg-chalk-blue" />
                            )}
                          </View>
                          <View className="ml-3 flex-1">
                            <View className="flex-row items-center">
                              <Text className="font-bold text-chalk-ink">
                                {addr.label}
                              </Text>
                              {addr.isDefault && (
                                <View className="ml-2 rounded bg-chalk-gold/20 px-2 py-0.5">
                                  <Text className="text-[10px] font-bold text-chalk-gold">
                                    DEFAULT
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text
                              className="mt-1 text-sm text-chalk-slate"
                              numberOfLines={2}
                            >
                              {addr.street}, {addr.city}, {addr.state}{" "}
                              {addr.zipCode}
                            </Text>
                            <Text className="text-xs text-chalk-slate">
                              {addr.country}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* Add New Address Form */}
              {showAddForm && (
                <AddAddressForm
                  onAdded={(addr) => {
                    setAddresses((prev) => [...prev, addr]);
                    setShowAddForm(false);
                    handleSelect(addr);
                  }}
                  onCancel={() => setShowAddForm(false)}
                />
              )}

              {!isAuthenticated && (
                <View className="items-center py-8 px-4">
                  <Ionicons name="person-outline" size={48} color="#CBD5E1" />
                  <Text className="mt-3 text-center text-sm text-chalk-slate">
                    Sign in to save and manage your delivery addresses
                  </Text>
                </View>
              )}

              <View className="h-8" />
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Inline Add Address Form ──────────────────────────────────────────────

function AddAddressForm({
  onAdded,
  onCancel,
}: {
  onAdded: (addr: Address) => void;
  onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
  });

  const inputClass =
    "rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base";
  const labelClass = "mb-1 text-sm font-semibold text-chalk-ink";

  const handleSave = async () => {
    if (!form.street.trim()) {
      toastError("Missing details", "Enter your street address");
      return;
    }
    if (!form.city.trim()) {
      toastError("Missing details", "Enter your city");
      return;
    }
    if (!isValidZipCode(form.zipCode)) {
      toastError("Invalid ZIP", "Enter a valid ZIP / postal code (4-10 digits)");
      return;
    }
    if (!form.state.trim()) {
      toastError("Missing details", "Enter your state");
      return;
    }

    setSaving(true);
    try {
      const res = await addressAPI.add(form);
      toastSuccess("Address saved");
      onAdded(res.data.address);
    } catch {
      toastError("Error", "Could not save address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="mx-4 mt-2 rounded-xl border border-chalk-line bg-white p-4">
      <Text className="mb-3 text-base font-bold text-chalk-ink">
        New Address
      </Text>

      <Text className={labelClass}>Label</Text>
      <View className="mb-3 flex-row gap-2">
        {["Home", "Work", "Other"].map((l) => (
          <TouchableOpacity
            key={l}
            className={`rounded-lg border px-4 py-2 ${
              form.label === l
                ? "border-chalk-blue bg-chalk-blue/10"
                : "border-chalk-line bg-chalk-mist"
            }`}
            onPress={() => setForm({ ...form, label: l })}
          >
            <Text
              className={`text-sm font-medium ${
                form.label === l ? "text-chalk-blue" : "text-chalk-slate"
              }`}
            >
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text className={labelClass}>Street Address</Text>
      <TextInput
        className={`${inputClass} mb-3`}
        placeholder="Enter street address"
        value={form.street}
        onChangeText={(v) => setForm({ ...form, street: v })}
      />

      <Text className={labelClass}>City</Text>
      <TextInput
        className={`${inputClass} mb-3`}
        placeholder="Enter city"
        value={form.city}
        onChangeText={(v) => setForm({ ...form, city: v })}
      />

      <View className="flex-row gap-3">
        <View className="flex-1">
          <Text className={labelClass}>ZIP Code</Text>
          <TextInput
            className={inputClass}
            placeholder="e.g. 452001"
            value={form.zipCode}
            onChangeText={(v) => setForm({ ...form, zipCode: v })}
            keyboardType="numeric"
          />
        </View>
        <View className="flex-1">
          <Text className={labelClass}>State</Text>
          <TextInput
            className={inputClass}
            placeholder="e.g. MP"
            value={form.state}
            onChangeText={(v) => setForm({ ...form, state: v })}
          />
        </View>
      </View>

      <Text className={`${labelClass} mt-3`}>Country</Text>
      <TextInput
        className={`${inputClass} mb-4`}
        placeholder="e.g. India"
        value={form.country}
        onChangeText={(v) => setForm({ ...form, country: v })}
      />

      <View className="flex-row gap-3">
        <TouchableOpacity
          className="flex-1 items-center rounded-xl border border-chalk-line bg-chalk-mist py-3"
          onPress={onCancel}
        >
          <Text className="font-semibold text-chalk-slate">Cancel</Text>
        </TouchableOpacity>
        <GoldButton
          className="flex-1 items-center py-3"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
        >
          <Text className="font-bold text-[#111111]">Save Address</Text>
        </GoldButton>
      </View>
    </View>
  );
}
