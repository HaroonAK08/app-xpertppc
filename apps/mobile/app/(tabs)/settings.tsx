import { Ionicons } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { useSessionStore } from "../../src/store/session";
import { Avatar, ScreenHeader } from "../../src/ui/components";
import { colors, radius } from "../../src/ui/theme";
type Me = {
  user: { name: string; email: string };
  organization: { id: string; name: string; timezone: string };
  role: string;
};
type Integration = {
  provider: string;
  status: string;
  lastSuccessAt: string | null;
};
type Membership = {
  role: string;
  organization: { id: string; name: string; slug: string };
};
type Tokens = { accessToken: string; refreshToken: string };
const Row = ({
  icon,
  title,
  body,
  onPress,
  tone = colors.blue,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  onPress?: () => void;
  tone?: string;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [s.row, pressed && s.pressed]}
  >
    <View style={[s.rowIcon, { backgroundColor: `${tone}16` }]}>
      <Ionicons name={icon} size={19} color={tone} />
    </View>
    <View style={s.rowCopy}>
      <Text style={s.rowTitle}>{title}</Text>
      <Text numberOfLines={1} style={s.rowBody}>
        {body}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
  </Pressable>
);
export default function Settings() {
  const clear = useSessionStore((s) => s.clear);
  const setTokens = useSessionStore((s) => s.setTokens);
  const cache = useQueryClient();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => api<Me>("/v1/auth/me"),
  });
  const organizations = useQuery({
    queryKey: ["organizations"],
    queryFn: () => api<Membership[]>("/v1/organizations"),
  });
  const integrations = useQuery({
    queryKey: ["integrations"],
    queryFn: () => api<Integration[]>("/v1/integrations"),
  });
  const meta = integrations.data?.find((x) => x.provider === "META");
  const role = me.data?.role;
  const canAdmin = role === "OWNER" || role === "ADMIN";
  const canManageTeam = canAdmin || role === "MANAGER";
  const switchOrganization = async (id: string) => {
    const tokens = await api<Tokens>(`/v1/organizations/${id}/switch`, {
      method: "POST",
    });
    await setTokens(tokens);
    cache.clear();
    router.replace("/(tabs)/home");
  };
  const logout = async () => {
    try {
      await api("/v1/auth/logout", { method: "POST" });
    } finally {
      await clear();
      router.replace("/(auth)/login");
    }
  };
  return (
    <SafeAreaView style={s.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <ScreenHeader eyebrow="WORKSPACE CONTROL" title="Settings" />
        <View style={s.profile}>
          <Avatar name={me.data?.user.name} size={54} />
          <View style={s.profileCopy}>
            <Text style={s.profileName}>
              {me.data?.user.name ?? "Your account"}
            </Text>
            <Text style={s.meta}>{me.data?.user.email}</Text>
          </View>
          <View style={s.role}>
            <Text style={s.roleText}>{me.data?.role ?? "—"}</Text>
          </View>
        </View>
        <Text style={s.section}>WORKSPACE</Text>
        <View style={s.group}>
          {canAdmin && (
            <>
              <Row
                icon="business-outline"
                title={me.data?.organization.name ?? "Organization"}
                body={`${me.data?.organization.timezone ?? "UTC"} timezone`}
                onPress={() => router.push("/settings/organization")}
              />
              <View style={s.rule} />
            </>
          )}
          {canManageTeam && (
            <>
              <Row
                icon="people-outline"
                title="Team and roles"
                body="Invite and manage access"
                onPress={() => router.push("/settings/team")}
              />
              <View style={s.rule} />
            </>
          )}
          {canAdmin && (
            <>
              <Row
                icon="git-branch-outline"
                title="Pipeline stages"
                body="Configure your sales process"
                onPress={() => router.push("/settings/pipeline")}
              />
              <View style={s.rule} />
            </>
          )}
          <Row
            icon="pricetags-outline"
            title="Lead tags"
            body="Organize your pipeline"
            onPress={() => router.push("/settings/tags")}
          />
        </View>
        <Text style={s.section}>INTEGRATIONS</Text>
        <View style={s.group}>
          <Row
            icon="logo-facebook"
            title="Facebook / Meta"
            body={meta?.status ?? "Not connected"}
            tone={meta?.status === "CONNECTED" ? colors.green : colors.blue}
            onPress={() => router.push("/(onboarding)/connect-meta")}
          />
        </View>
        {canAdmin && (
          <>
            <Text style={s.section}>PLAN & USAGE</Text>
            <View style={s.group}>
              <Row
                icon="card-outline"
                title="Billing and usage"
                body="Limits, usage, and plan details"
                onPress={() => router.push("/settings/billing")}
              />
            </View>
          </>
        )}
        {(organizations.data?.length ?? 0) > 1 && (
          <>
            <Text style={s.section}>ORGANIZATIONS</Text>
            <View style={s.group}>
              {organizations.data?.map((item, index) => (
                <View key={item.organization.id}>
                  {index > 0 && <View style={s.rule} />}
                  <Pressable
                    disabled={item.organization.id === me.data?.organization.id}
                    onPress={() =>
                      void switchOrganization(item.organization.id)
                    }
                    style={s.org}
                  >
                    <View
                      style={[
                        s.orgMark,
                        item.organization.id === me.data?.organization.id &&
                          s.orgMarkActive,
                      ]}
                    >
                      <Text style={s.orgInitial}>
                        {item.organization.name[0].toUpperCase()}
                      </Text>
                    </View>
                    <View style={s.rowCopy}>
                      <Text style={s.rowTitle}>{item.organization.name}</Text>
                      <Text style={s.rowBody}>
                        {item.organization.id === me.data?.organization.id
                          ? "Current workspace"
                          : `Switch · ${item.role}`}
                      </Text>
                    </View>
                    {item.organization.id === me.data?.organization.id ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.green}
                      />
                    ) : (
                      <Ionicons
                        name="swap-horizontal"
                        size={20}
                        color={colors.blue}
                      />
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        )}
        <Pressable style={s.logout} onPress={() => void logout()}>
          <Ionicons name="log-out-outline" size={19} color={colors.danger} />
          <Text style={s.logoutText}>Log out</Text>
        </Pressable>
        <Text style={s.version}>XPERT CRM · VERSION 0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 18, paddingTop: 16, paddingBottom: 35 },
  profile: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 17,
    marginTop: 19,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileCopy: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 17, fontWeight: "900", color: "#fff" },
  meta: { fontSize: 12, color: "#9FB0CA", marginTop: 4 },
  role: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: "#2C4974",
  },
  roleText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
    color: colors.green,
  },
  section: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: colors.muted,
    marginTop: 25,
    marginBottom: 9,
    marginLeft: 3,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
  },
  row: {
    minHeight: 72,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  rowIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: "800", color: colors.ink },
  rowBody: { fontSize: 11, color: colors.muted, marginTop: 3 },
  rule: { height: 1, backgroundColor: colors.line, marginLeft: 65 },
  org: {
    minHeight: 67,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  orgMark: {
    width: 37,
    height: 37,
    borderRadius: 12,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  orgMarkActive: { backgroundColor: colors.greenSoft },
  orgInitial: { fontWeight: "900", color: colors.blueDark },
  logout: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#F3C9CA",
    backgroundColor: colors.dangerSoft,
    marginTop: 27,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: colors.danger, fontWeight: "800" },
  version: {
    fontSize: 9,
    letterSpacing: 1,
    color: colors.subtle,
    textAlign: "center",
    marginTop: 18,
  },
});
