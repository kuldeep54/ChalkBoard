import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import GoldButton from "../../components/gold-button";
import { toastError, getErrorMessage, isValidEmail } from "../../utils/helpers";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      toastError("Error", "Please fill in all fields");
      return;
    }
    if (name.trim().length < 2) {
      toastError("Error", "Please enter your full name");
      return;
    }
    if (!isValidEmail(email)) {
      toastError("Error", "Please enter a valid email");
      return;
    }
    if (password !== confirmPassword) {
      toastError("Error", "Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toastError("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
    } catch (err) {
      toastError("Registration Failed", getErrorMessage(err));
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
          <Text className="text-4xl font-bold text-chalk-indigo">ChalkBoard</Text>
          <Text className="mt-2 text-base text-chalk-slate">
            Create your account to get started.
          </Text>
        </View>

        <View className="gap-3">
          <Text className="mb-1 text-sm font-semibold text-chalk-ink">Full Name</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base"
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

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

          <Text className="mb-1 text-sm font-semibold text-chalk-ink">Confirm Password</Text>
          <TextInput
            className="rounded-xl border border-chalk-line bg-chalk-mist p-4 text-base"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <GoldButton
            className="mt-2 items-center p-4"
            onPress={handleRegister}
            disabled={loading}
            loading={loading}
          >
            <Text className="text-base font-bold text-[#111111]">Create Account</Text>
          </GoldButton>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-sm text-chalk-slate">
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/login" className="text-sm font-semibold text-chalk-blue">
              Sign In
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}