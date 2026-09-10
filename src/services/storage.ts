import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

let cachedModule: SecureStoreModule | null = null;

const getSecureStore = (): SecureStoreModule | null => {
  if (cachedModule !== null) return cachedModule;
  if (Platform.OS === "web") {
    cachedModule = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedModule = require("expo-secure-store") as SecureStoreModule;
  } catch {
    cachedModule = null;
  }
  return cachedModule;
};

export const secureGet = (key: string): Promise<string | null> => {
  const mod = getSecureStore();
  return mod ? mod.getItemAsync(key) : AsyncStorage.getItem(key);
};

export const secureSet = (key: string, value: string): Promise<void> => {
  const mod = getSecureStore();
  return mod ? mod.setItemAsync(key, value) : AsyncStorage.setItem(key, value);
};

export const secureDelete = (key: string): Promise<void> => {
  const mod = getSecureStore();
  return mod ? mod.deleteItemAsync(key) : AsyncStorage.removeItem(key);
};