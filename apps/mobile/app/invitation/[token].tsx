import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/services/api/client";
import { useSessionStore } from "../../src/store/session";
import { BrandMark } from "../../src/ui/components";
import { Notice, PrimaryButton } from "../../src/ui/flows";
import { colors, radius } from "../../src/ui/theme";
export default function AcceptInvitation() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const authenticated = useSessionStore((s) => !!s.accessToken);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const accept = async () => {
    setWorking(true);
    setError("");
    try {
      const result = await api<{ organizationId: string }>(
        "/v1/team/invitations/accept",
        { method: "POST", body: JSON.stringify({ token }) },
      );
      const tokens = await api<{ accessToken: string; refreshToken: string }>(
        `/v1/organizations/${result.organizationId}/switch`,
        { method: "POST" },
      );
      await useSessionStore.getState().setTokens(tokens);
      router.replace("/(tabs)/home");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Invitation could not be accepted",
      );
    } finally {
      setWorking(false);
    }
  };
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.top}>
        <BrandMark />
      </View>
      <View style={s.content}>
        <View style={s.visual}>
          <View style={s.orbit}>
            <Ionicons name="people" size={37} color={colors.blue} />
          </View>
          <View style={s.check}>
            <Ionicons name="checkmark" size={15} color={colors.navy} />
          </View>
        </View>
        <Text style={s.eyebrow}>YOU’RE INVITED</Text>
        <Text style={s.title}>Join your team.</Text>
        <Text style={s.body}>
          {authenticated
            ? "Accept this invitation to add the workspace to your account and start collaborating."
            : "Sign in with the invited email address, then reopen this secure invitation link."}
        </Text>
        <View style={s.features}>
          {[
            ["shield-checkmark-outline", "Tenant-isolated workspace"],
            ["flash-outline", "Realtime lead collaboration"],
            ["chatbubbles-outline", "Shared customer inbox"],
          ].map(([icon, label]) => (
            <View key={label} style={s.feature}>
              <Ionicons
                name={icon as keyof typeof Ionicons.glyphMap}
                size={17}
                color={colors.green}
              />
              <Text style={s.featureText}>{label}</Text>
            </View>
          ))}
        </View>
        {Boolean(error) && <Notice>{error}</Notice>}
        <PrimaryButton
          label={authenticated ? "Accept invitation" : "Sign in to continue"}
          icon={authenticated ? "checkmark" : "log-in-outline"}
          loading={working}
          onPress={() =>
            authenticated ? void accept() : router.replace("/(auth)/login")
          }
        />
        {!authenticated && (
          <Pressable onPress={() => router.push("/(auth)/signup")}>
            <Text style={s.link}>New here? Create an account</Text>
          </Pressable>
        )}
        <Text style={s.security}>
          <Ionicons name="lock-closed" size={10} /> Invitation links are
          single-use and time limited
        </Text>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.navy },
  top: { height: 76, paddingHorizontal: 24, justifyContent: "center" },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    paddingBottom: 60,
    gap: 12,
  },
  visual: { alignSelf: "center", marginBottom: 23 },
  orbit: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: "#31527F",
    alignItems: "center",
    justifyContent: "center",
  },
  check: {
    position: "absolute",
    right: 0,
    bottom: 1,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.navy,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: colors.green,
    textAlign: "center",
  },
  title: {
    fontSize: 35,
    fontWeight: "900",
    letterSpacing: -1,
    color: "#fff",
    textAlign: "center",
  },
  body: { fontSize: 14, lineHeight: 22, color: "#AFC0DC", textAlign: "center" },
  features: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: colors.navySoft,
    padding: 15,
    gap: 12,
    marginVertical: 10,
  },
  feature: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { fontSize: 12, fontWeight: "600", color: "#C0CEE1" },
  link: {
    textAlign: "center",
    padding: 6,
    color: "#8EC3FF",
    fontWeight: "700",
    fontSize: 12,
  },
  security: {
    fontSize: 9,
    color: "#637899",
    textAlign: "center",
    marginTop: 5,
  },
});
