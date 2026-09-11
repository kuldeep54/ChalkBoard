import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { authAPI } from "../../services/api";
import GoldButton from "../../components/gold-button";
import { toastError, toastSuccess, getErrorMessage, isValidEmail } from "../../utils/helpers";

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email: initialEmail, token: initialToken } = useLocalSearchParams<{
    email?: string;
    token?: string;
  }>();

  const [email, setEmail] = useState(initialEmail ?? "");
  const [token, setToken] = useState(initialToken ?? "");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleVerify = async () => {
    const code = initialToken && initialToken.length > 6 ? initialToken : token;
    if (!code) {
      toastError("Error", "Please enter your 6-digit verification code");
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyEmail(code);
      toastSuccess("Verified!", "Your email has been verified. You can now sign in.");
      router.replace("/(auth)/login");
    } catch (err) {
      toastError("Verification failed", getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !isValidEmail(email)) {
      toastError("Error", "Enter a valid email to resend a verification link");
      return;
    }
    setResending(true);
    try {
      await authAPI.resendVerification(email);
      toastSuccess("Email sent", "A new verification link has been sent.");
    } catch (err) {
      toastError("Failed", getErrorMessage(err));
    } finally {
      setResending(false);
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
            <Ionicons name="mail-open-outline" size={32} color="#fff" />
          </View>
          <Text className="text-3xl font-bold text-chalk-ink">Verify your email</Text>
          <Text className="mt-2 text-center text-base text-chalk-slate">
            We sent a verification link to your email. Enter the code below or
            open the link on this device.
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

          <Text className="mb-1 text-sm font-semibold text-chalk-ink">Verification code</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-center text-2xl font-bold tracking-widest text-chalk-ink"
            placeholder="— — — — — —"
            value={token}
            onChangeText={setToken}
            keyboardType="number-pad"
            maxLength={6}
            autoCorrect={false}
          />

          <GoldButton
            className="mt-2 items-center p-4"
            onPress={handleVerify}
            disabled={loading}
            loading={loading}
          >
            <Text className="text-base font-bold text-[#111111]">Verify Email</Text>
          </GoldButton>

          <View className="mt-4 flex-row items-center justify-center">
            <Text className="text-sm text-chalk-slate">{"Didn't get the link? "}</Text>
            <GoldButton
              onPress={handleResend}
              disabled={resending}
              loading={resending}
            >
              <Text className="text-sm font-semibold text-chalk-indigo">
                Resend email
              </Text>
            </GoldButton>
          </View>

          <View className="mt-4 flex-row justify-center">
            <Text className="text-sm text-chalk-slate">Done verifying? </Text>
            <Text
              onPress={() => router.replace("/(auth)/login")}
              className="text-sm font-semibold text-chalk-blue"
            >
              Sign In
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}