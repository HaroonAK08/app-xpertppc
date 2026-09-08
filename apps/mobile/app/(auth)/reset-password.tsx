import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
export default function ResetPassword() {
  const params = useLocalSearchParams<{ token?: string }>();
  const [token, setToken] = useState(params.token ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hidden, setHidden] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const valid = !!token && password.length >= 12 && password === confirm;
  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      await api("/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.replace("/(auth)/login");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
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
        <Text style={s.eyebrow}>SECURE YOUR ACCOUNT</Text>
        <Text style={s.title}>Choose a new{`\n`}password.</Text>
        <Text style={s.body}>
          Use at least 12 characters. Signing in on other devices will be
          required again.
        </Text>
        <View style={s.form}>
          {!params.token && (
            <>
              <Text style={s.label}>RESET TOKEN</Text>
              <View style={s.inputWrap}>
                <Ionicons name="key-outline" size={19} color={colors.subtle} />
                <TextInput
                  autoCapitalize="none"
                  value={token}
                  onChangeText={setToken}
                  placeholder="Paste reset token"
                  placeholderTextColor={colors.subtle}
                  style={s.input}
                />
              </View>
            </>
          )}
          <Text style={s.label}>NEW PASSWORD</Text>
          <View style={s.inputWrap}>
            <Ionicons
              name="lock-closed-outline"
              size={19}
              color={colors.subtle}
            />
            <TextInput
              secureTextEntry={hidden}
              value={password}
              onChangeText={setPassword}
              placeholder="12+ characters"
              placeholderTextColor={colors.subtle}
              style={s.input}
            />
            <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
              <Ionicons
                name={hidden ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={colors.muted}
              />
            </Pressable>
          </View>
          <View style={s.strength}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  s.strengthBar,
                  password.length >= (i + 1) * 4 && s.strengthActive,
                ]}
              />
            ))}
          </View>
          <Text style={s.label}>CONFIRM PASSWORD</Text>
          <View style={s.inputWrap}>
            <Ionicons
              name="shield-checkmark-outline"
              size={19}
              color={colors.subtle}
            />
            <TextInput
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Repeat password"
              placeholderTextColor={colors.subtle}
              style={s.input}
            />
            {confirm.length > 0 && (
              <Ionicons
                name={
                  password === confirm ? "checkmark-circle" : "close-circle"
                }
                size={20}
                color={password === confirm ? colors.green : colors.danger}
              />
            )}
          </View>
          {Boolean(error) && <Notice>{error}</Notice>}
          <PrimaryButton
            label="Update password"
            icon="shield-checkmark"
            loading={loading}
            disabled={!valid}
            onPress={() => void submit()}
          />
        </View>
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
    marginTop: 30,
    marginBottom: 32,
  },
  backText: { color: "#fff", fontWeight: "700" },
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
  form: { gap: 10, marginTop: 26 },
  label: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#DCE7F8",
    marginTop: 5,
  },
  inputWrap: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: colors.navySoft,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, height: "100%", fontSize: 15, color: "#fff" },
  strength: { flexDirection: "row", gap: 5 },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#29446C",
  },
  strengthActive: { backgroundColor: colors.green },
});
