import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../../services/api";
import GoldButton from "../../components/gold-button";
import { toastError, toastSuccess, getErrorMessage } from "../../utils/helpers";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token || !newPassword || !confirmPassword) {
      toastError("Missing fields", "Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("Error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toastError("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(token, newPassword);
      toastSuccess("Password reset", "You can now log in with your new password");
      router.replace("/(auth)/login");
    } catch (err) {
      toastError("Reset failed", getErrorMessage(err));
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
        <View className="mb-9 items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-chalk-indigo">
            <Ionicons name="key-outline" size={32} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-chalk-ink">Set New Password</Text>
          <Text className="mt-2 text-center text-base text-chalk-slate">
            Enter the reset token you received along with your new password.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="mb-1 text-sm font-semibold text-chalk-ink">Reset Token</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base"
            placeholder="Paste your reset token"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text className="mb-1 text-sm font-semibold text-chalk-ink">New Password</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base"
            placeholder="Enter a new password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text className="mb-1 text-sm font-semibold text-chalk-ink">Confirm Password</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base"
            placeholder="Re-enter new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <GoldButton
            className="mt-2 items-center p-4"
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
          >
            <Text className="text-base font-bold text-[#111111]">Reset Password</Text>
          </GoldButton>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-sm text-chalk-slate">Remember it now? </Text>
            <Link href="/(auth)/login" className="text-sm font-semibold text-chalk-blue">
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}