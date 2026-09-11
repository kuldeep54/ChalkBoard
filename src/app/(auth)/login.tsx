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
import { useAuth } from "../../context/AuthContext";
import GoldButton from "../../components/gold-button";
import { toastError, getErrorMessage, isValidEmail } from "../../utils/helpers";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      toastError("Error", "Please fill in all fields");
      return;
    }
    if (!isValidEmail(email)) {
      toastError("Error", "Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const e = err as {
        response?: {
          status?: number;
          data?: {
            requiresVerification?: boolean;
            email?: string;
            message?: string;
          };
        };
      };
      if (e.response?.data?.requiresVerification) {
        toastError(
          "Email not verified",
          "Please verify your email to continue."
        );
        router.push({
          pathname: "/(auth)/verify-email",
          params: { email: e.response.data.email ?? email },
        });
      } else {
        toastError("Login Failed", getErrorMessage(err));
      }
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
        <View className="mb-12 items-center">
          <Text className="text-4xl font-bold text-chalk-indigo">ChalkBoard</Text>
          <Text className="mt-2 text-base text-chalk-slate">
            Welcome back! Sign in to continue.
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

          <Text className="mb-1 text-sm font-semibold text-chalk-ink">Password</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View className="items-end py-1">
            <Link href="/(auth)/forgot-password">
              <Text className="text-sm font-semibold text-chalk-blue">
                Forgot Password?
              </Text>
            </Link>
          </View>

          <GoldButton className="mt-2 items-center p-4" onPress={handleLogin} disabled={loading} loading={loading}>
            <Text className="text-base font-bold text-[#111111]">Sign In</Text>
          </GoldButton>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-chalk-slate">
              {"Don't have an account? "}
            </Text>
            <Link href="/(auth)/register" className="text-sm font-semibold text-chalk-blue">
              Sign Up
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}