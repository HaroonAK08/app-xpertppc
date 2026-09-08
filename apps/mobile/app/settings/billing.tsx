import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { EmptyState, ScreenHeader } from "../../src/ui/components";
import { colors, radius } from "../../src/ui/theme";
type Plan = {
  name: string;
  key: string;
  leadLimit: number;
  userLimit: number;
  pageLimit: number;
  messageLimit: number;
};
type Usage = { metric: string; value: number };
type Billing = {
  plan: Plan | null;
  subscription: { status: string; currentPeriodEnd: string | null } | null;
  usage: Usage[];
};
const UsageRow = ({
  icon,
  label,
  value,
  limit,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  limit: number;
}) => {
  const ratio = Math.min(value / Math.max(limit, 1), 1);
  return (
    <View style={s.usage}>
      <View style={s.usageHead}>
        <View style={s.usageLabel}>
          <Ionicons name={icon} size={17} color={colors.blue} />
          <Text style={s.usageName}>{label}</Text>
        </View>
        <Text style={s.usageValue}>
          {value.toLocaleString()}{" "}
          <Text style={s.usageLimit}>/ {limit.toLocaleString()}</Text>
        </Text>
      </View>
      <View style={s.track}>
        <View
          style={[
            s.fill,
            {
              width: `${ratio * 100}%`,
              backgroundColor: ratio > 0.85 ? colors.warning : colors.blue,
            },
          ]}
        />
      </View>
    </View>
  );
};
export default function Billing() {
  const query = useQuery({
    queryKey: ["billing"],
    queryFn: () => api<Billing>("/v1/billing/current"),
  });
  const data = query.data;
  const used = (metric: string) =>
    data?.usage.find((x) => x.metric === metric)?.value ?? 0;
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Billing",
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.canvas },
        }}
      />
      <ScrollView contentContainerStyle={s.content}>
        <ScreenHeader eyebrow="PLAN & CAPACITY" title="Billing and usage" />
        <Text style={s.intro}>
          See how much capacity your workspace has used this billing period.
        </Text>
        {query.isLoading ? (
          <ActivityIndicator color={colors.blue} />
        ) : query.isError || !data?.plan ? (
          <EmptyState
            icon="card-outline"
            title="Billing unavailable"
            body="Plan details could not be loaded for this workspace."
          />
        ) : (
          <>
            <View style={s.plan}>
              <View style={s.planTop}>
                <View>
                  <Text style={s.planLabel}>CURRENT PLAN</Text>
                  <Text style={s.planName}>{data.plan.name}</Text>
                </View>
                <View style={s.active}>
                  <View style={s.activeDot} />
                  <Text style={s.activeText}>
                    {data.subscription?.status ?? "ACTIVE"}
                  </Text>
                </View>
              </View>
              <Text style={s.planBody}>
                Built for focused teams turning paid media leads into revenue.
              </Text>
              <View style={s.planRule} />
              <View style={s.period}>
                <Ionicons name="calendar-outline" size={16} color="#9FB0CA" />
                <Text style={s.periodText}>
                  {data.subscription?.currentPeriodEnd
                    ? `Renews ${new Date(data.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : "Monthly usage cycle"}
                </Text>
              </View>
            </View>
            <Text style={s.section}>THIS PERIOD</Text>
            <View style={s.usageCard}>
              <UsageRow
                icon="people-outline"
                label="Leads"
                value={used("leads")}
                limit={data.plan.leadLimit}
              />
              <UsageRow
                icon="chatbubbles-outline"
                label="Messages"
                value={used("messages")}
                limit={data.plan.messageLimit}
              />
              <UsageRow
                icon="person-add-outline"
                label="Team members"
                value={used("users")}
                limit={data.plan.userLimit}
              />
              <UsageRow
                icon="flag-outline"
                label="Facebook Pages"
                value={used("pages")}
                limit={data.plan.pageLimit}
              />
            </View>
            <View style={s.note}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={colors.blue}
              />
              <Text style={s.noteText}>
                Plan upgrades and payment management will become available when
                the billing provider is connected.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 18, paddingBottom: 38 },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginTop: 5,
    marginBottom: 18,
  },
  plan: { backgroundColor: colors.navy, borderRadius: radius.xl, padding: 19 },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  planLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: colors.green,
  },
  planName: { fontSize: 28, fontWeight: "900", color: "#fff", marginTop: 5 },
  active: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.navySoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.green,
  },
  activeText: { fontSize: 8, fontWeight: "900", color: colors.green },
  planBody: { fontSize: 12, lineHeight: 18, color: "#9FB0CA", marginTop: 12 },
  planRule: { height: 1, backgroundColor: "#29446C", marginVertical: 15 },
  period: { flexDirection: "row", alignItems: "center", gap: 7 },
  periodText: { fontSize: 10, color: "#9FB0CA" },
  section: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: colors.muted,
    marginTop: 26,
    marginBottom: 10,
  },
  usageCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 20,
  },
  usage: { gap: 8 },
  usageHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  usageLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  usageName: { fontSize: 12, fontWeight: "800", color: colors.ink },
  usageValue: { fontSize: 12, fontWeight: "900", color: colors.ink },
  usageLimit: { color: colors.subtle, fontWeight: "600" },
  track: {
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surfaceAlt,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 4 },
  note: {
    marginTop: 16,
    borderRadius: radius.md,
    backgroundColor: colors.blueSoft,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noteText: { flex: 1, fontSize: 10, lineHeight: 16, color: colors.blueDark },
});
