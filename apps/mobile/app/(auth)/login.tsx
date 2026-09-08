import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";
import { api } from "../../src/services/api/client";
import { useSessionStore } from "../../src/store/session";
import { BrandMark } from "../../src/ui/components";
import { colors, radius } from "../../src/ui/theme";
const schema = z.object({
  email: z.email("Enter a valid work email"),
  password: z.string().min(12, "Password must be at least 12 characters"),
});
type Form = z.infer<typeof schema>;
export default function Login() {
  const [hidden, setHidden] = useState(true);
  const [serverError, setServerError] = useState("");
  const setTokens = useSessionStore((s) => s.setTokens);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });
  const submit = handleSubmit(async (values) => {
    setServerError("");
    try {
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        "/v1/auth/login",
        { method: "POST", body: JSON.stringify(values) },
      );
      await setTokens(tokens);
      router.replace("/(tabs)/home");
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Sign in failed");
    }
  });
  return (
    <SafeAreaView style={s.page}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={s.content}
        >
          <BrandMark />
          <View style={s.hero}>
            <Text style={s.eyebrow}>LEAD COMMAND CENTER</Text>
            <Text style={s.title}>Welcome back.</Text>
            <Text style={s.subtitle}>
              Move faster. Follow up smarter. Close more.
            </Text>
          </View>
          <View style={s.form}>
            <Text style={s.label}>Work email</Text>
            <View style={[s.inputWrap, errors.email && s.inputError]}>
              <Ionicons name="mail-outline" size={19} color={colors.subtle} />
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <TextInput
                    accessibilityLabel="Work email"
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholder="you@company.com"
                    placeholderTextColor={colors.subtle}
                    style={s.input}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                  />
                )}
              />
            </View>
            {errors.email && (
              <Text style={s.error}>{errors.email.message}</Text>
            )}
            <Text style={s.label}>Password</Text>
            <View style={[s.inputWrap, errors.password && s.inputError]}>
              <Ionicons
                name="lock-closed-outline"
                size={19}
                color={colors.subtle}
              />
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <TextInput
                    accessibilityLabel="Password"
                    secureTextEntry={hidden}
                    autoComplete="password"
                    placeholder="Your secure password"
                    placeholderTextColor={colors.subtle}
                    style={s.input}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChangeText={field.onChange}
                  />
                )}
              />
              <Pressable hitSlop={8} onPress={() => setHidden((v) => !v)}>
                <Ionicons
                  name={hidden ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={colors.muted}
                />
              </Pressable>
            </View>
            {errors.password && (
              <Text style={s.error}>{errors.password.message}</Text>
            )}
            <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
              <Text style={s.forgot}>Forgot password?</Text>
            </Pressable>
            {Boolean(serverError) && (
              <View style={s.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={colors.danger}
                />
                <Text style={s.errorBoxText}>{serverError}</Text>
              </View>
            )}
            <Pressable
              disabled={isSubmitting}
              onPress={submit}
              style={({ pressed }) => [
                s.button,
                pressed && s.pressed,
                isSubmitting && s.disabled,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={s.buttonText}>Sign in</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </>
              )}
            </Pressable>
            <View style={s.divider}>
              <View style={s.line} />
              <Text style={s.or}>NEW TO XPERT CRM?</Text>
              <View style={s.line} />
            </View>
            <Pressable
              onPress={() => router.push("/(auth)/signup")}
              style={s.outline}
            >
              <Text style={s.outlineText}>Create a business workspace</Text>
            </Pressable>
          </View>
          <Text style={s.legal}>
            Secure multi-tenant access · Built by XpertPPC
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.navy },
  content: { flexGrow: 1, padding: 24, paddingTop: 38, paddingBottom: 28 },
  hero: { marginTop: 54, marginBottom: 32 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: colors.green,
    marginBottom: 10,
  },
  title: {
    fontSize: 39,
    lineHeight: 45,
    fontWeight: "900",
    letterSpacing: -1.2,
    color: "#fff",
  },
  subtitle: { fontSize: 15, lineHeight: 23, color: "#AFC0DC", marginTop: 9 },
  form: { gap: 9 },
  label: { fontSize: 12, fontWeight: "800", color: "#DCE7F8", marginTop: 6 },
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
  inputError: { borderColor: colors.danger },
  input: { flex: 1, fontSize: 15, color: "#fff", height: "100%" },
  error: { fontSize: 11, color: "#FF9B9F" },
  forgot: {
    color: "#8EC3FF",
    fontWeight: "700",
    fontSize: 13,
    textAlign: "right",
    paddingVertical: 4,
  },
  errorBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#3A1930",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  errorBoxText: { flex: 1, color: "#FFB5B8", fontSize: 12 },
  button: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.6 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 13,
  },
  line: { flex: 1, height: 1, backgroundColor: "#253B60" },
  or: { fontSize: 9, fontWeight: "800", letterSpacing: 1, color: "#7185A5" },
  outline: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#35557F",
    alignItems: "center",
    justifyContent: "center",
  },
  outlineText: { color: "#fff", fontWeight: "800" },
  legal: {
    color: "#657A9D",
    fontSize: 10,
    textAlign: "center",
    marginTop: "auto",
    paddingTop: 32,
  },
});
