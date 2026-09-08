import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { BrandMark } from "../../src/ui/components";
import { Notice, PrimaryButton } from "../../src/ui/flows";
import { colors, radius } from "../../src/ui/theme";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await api("/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={s.content}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <BrandMark />
        <Pressable onPress={() => router.back()} style={s.back}>
          <Ionicons name="arrow-back" size={18} color="#fff" />
          <Text style={s.backText}>Back</Text>
        </Pressable>
        <View style={s.icon}>
          <Ionicons
            name={sent ? "mail-open-outline" : "key-outline"}
            size={31}
            color={sent ? colors.green : colors.blue}
          />
        </View>
        <Text style={s.eyebrow}>
          {sent ? "EMAIL SENT" : "ACCOUNT RECOVERY"}
        </Text>
        <Text style={s.title}>
          {sent ? "Check your inbox." : "Reset your password."}
        </Text>
        <Text style={s.body}>
          {sent
            ? `If an account exists for ${email}, a secure reset link is on its way.`
            : "Enter your work email and we’ll send a single-use link that expires in 30 minutes."}
        </Text>
        {sent ? (
          <View style={s.actions}>
            <Notice tone="success">
              For your security, we never confirm whether an email is
              registered.
            </Notice>
            <PrimaryButton
              label="Back to sign in"
              icon="log-in-outline"
              onPress={() => router.replace("/(auth)/login")}
            />
            <Pressable onPress={() => setSent(false)}>
              <Text style={s.link}>Use a different email</Text>
            </Pressable>
          </View>
        ) : (
          <View style={s.actions}>
            <Text style={s.label}>WORK EMAIL</Text>
            <View style={s.inputWrap}>
              <Ionicons name="mail-outline" size={19} color={colors.subtle} />
              <TextInput
                accessibilityLabel="Work email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@company.com"
                placeholderTextColor={colors.subtle}
                style={s.input}
              />
            </View>
            {Boolean(error) && <Notice>{error}</Notice>}
            <PrimaryButton
              label="Send reset link"
              icon="send-outline"
              loading={loading}
              disabled={!valid}
              onPress={() => void submit()}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.navy },
  content: { flex: 1, padding: 24, paddingTop: 38 },
  back: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 34,
    marginBottom: 43,
  },
  backText: { color: "#fff", fontWeight: "700" },
  icon: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: "#29446C",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: colors.green,
    marginBottom: 9,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1,
    color: "#fff",
  },
  body: { fontSize: 14, lineHeight: 22, color: "#AFC0DC", marginTop: 10 },
  actions: { gap: 12, marginTop: 30 },
  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#DCE7F8",
  },
  inputWrap: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: colors.navySoft,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, height: "100%", fontSize: 15, color: "#fff" },
  link: {
    color: "#8EC3FF",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    padding: 7,
  },
});
