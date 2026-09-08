import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../../src/services/api/client";
import { Notice, OnboardingShell, PrimaryButton } from "../../src/ui/flows";
import { colors, radius } from "../../src/ui/theme";
export default function ConnectMeta() {
  const connect = useMutation({
    mutationFn: () =>
      api<{ authorizationUrl: string }>("/v1/integrations/meta/connect/start", {
        method: "POST",
      }),
    onSuccess: async (result) => {
      await Linking.openURL(result.authorizationUrl);
    },
  });
  return (
    <OnboardingShell
      step={1}
      title={"Connect your\nlead source."}
      body="Link Facebook securely and we’ll bring qualified Lead Ads submissions into one fast-moving pipeline."
    >
      <View style={s.provider}>
        <View style={s.facebook}>
          <Ionicons name="logo-facebook" size={30} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.providerName}>Facebook Lead Ads</Text>
          <Text style={s.providerMeta}>Pages · Forms · Messenger</Text>
        </View>
        <View style={s.secure}>
          <Ionicons name="shield-checkmark" size={14} color={colors.green} />
          <Text style={s.secureText}>Secure</Text>
        </View>
      </View>
      <View style={s.points}>
        {[
          ["lock-closed-outline", "Credentials never touch your phone"],
          ["flash-outline", "New leads arrive automatically"],
          ["notifications-outline", "Instant push and realtime alerts"],
        ].map(([icon, label]) => (
          <View key={label} style={s.point}>
            <View style={s.pointIcon}>
              <Ionicons
                name={icon as keyof typeof Ionicons.glyphMap}
                size={17}
                color={colors.blue}
              />
            </View>
            <Text style={s.pointText}>{label}</Text>
          </View>
        ))}
      </View>
      {connect.isError && (
        <Notice>
          Connection could not start. Check the integration configuration and
          try again.
        </Notice>
      )}
      <PrimaryButton
        label="Connect Facebook"
        icon="logo-facebook"
        loading={connect.isPending}
        onPress={() => connect.mutate()}
      />
      <Pressable
        onPress={() => router.push("/(onboarding)/select-page")}
        style={s.continue}
      >
        <Text style={s.continueText}>I completed authorization</Text>
        <Ionicons name="arrow-forward" size={15} color="#8EC3FF" />
      </Pressable>
      <Text style={s.disclaimer}>
        You can disconnect at any time. We never store Facebook passwords.
      </Text>
    </OnboardingShell>
  );
}
const s = StyleSheet.create({
  provider: {
    minHeight: 82,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: "#10254B",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  facebook: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#1877F2",
    alignItems: "center",
    justifyContent: "center",
  },
  providerName: { fontSize: 15, fontWeight: "900", color: "#fff" },
  providerMeta: { fontSize: 11, color: "#8298B9", marginTop: 4 },
  secure: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#173B38",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  secureText: {
    fontSize: 9,
    fontWeight: "900",
    color: colors.green,
    textTransform: "uppercase",
  },
  points: { gap: 12, paddingVertical: 8 },
  point: { flexDirection: "row", alignItems: "center", gap: 10 },
  pointIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#142F57",
    alignItems: "center",
    justifyContent: "center",
  },
  pointText: { fontSize: 12, color: "#B7C6DC", fontWeight: "600" },
  continue: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  continueText: { fontSize: 12, fontWeight: "800", color: "#8EC3FF" },
  disclaimer: {
    fontSize: 9,
    lineHeight: 14,
    color: "#617799",
    textAlign: "center",
  },
});
