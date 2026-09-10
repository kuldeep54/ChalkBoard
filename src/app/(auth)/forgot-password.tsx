import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../../services/api";
import GoldButton from "../../components/gold-button";
import { toastError, toastSuccess, getErrorMessage, isValidEmail } from "../../utils/helpers";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      toastError("Missing email", "Please enter your email address");
      return;
    }
    if (!isValidEmail(email)) {
      toastError("Error", "Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      toastSuccess("Check your inbox", "A reset link has been sent to your email");
      router.replace("/(auth)/reset-password");
    } catch (err) {
      toastError("Request failed", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <View className="mb-10 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-chalk-indigo">
            <Ionicons name="mail-outline" size={32} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-chalk-ink">Reset Password</Text>
          <Text className="mt-2 text-center text-base text-chalk-slate">
            {"Enter your email and we'll send you a link to reset your password."}
          </Text>
        </View>

        <View className="gap-3">
          <Text className="mb-1 text-sm font-semibold text-chalk-ink">Email</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text className="text-xs text-chalk-slate">
            Demo mode: the reset token is printed to the backend console.
          </Text>
          <GoldButton
            className="mt-2 items-center p-4"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
          >
            <Text className="text-base font-bold text-[#111111]">
              Send Reset Link
            </Text>
          </GoldButton>

          <TouchableOpacity
            className="mt-6 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-sm font-semibold text-chalk-blue">
              Back to Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}