import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import {
  BrandMark,
  EmptyState,
  Skeleton,
  StatusPill,
} from "../../src/ui/components";
import { colors, radius, shadow } from "../../src/ui/theme";
type Dashboard = {
  today: number;
  newLeads: number;
  assigned: number;
  unread: number;
  recent: Array<{
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
    status: { name: string };
  }>;
};
const Metric = ({
  icon,
  value,
  label,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  tone: string;
}) => (
  <View style={s.metric}>
    <View style={[s.metricIcon, { backgroundColor: `${tone}18` }]}>
      <Ionicons name={icon} size={18} color={tone} />
    </View>
    <Text style={s.metricValue}>{value}</Text>
    <Text style={s.metricLabel}>{label}</Text>
  </View>
);
export default function Home() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api<Dashboard>("/v1/dashboard"),
  });
  const d = query.data;
  return (
    <SafeAreaView style={s.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => void query.refetch()}
            tintColor={colors.blue}
          />
        }
        contentContainerStyle={s.content}
      >
        <View style={s.top}>
          <BrandMark />
          <Pressable
            accessibilityLabel="Open notifications"
            accessibilityRole="button"
            onPress={() => router.push("/notifications")}
            style={s.bell}
          >
            <Ionicons name="notifications-outline" size={21} color="#fff" />
            {(d?.unread ?? 0) > 0 && <View style={s.alert} />}
          </Pressable>
        </View>
        <View style={s.hero}>
          <Text style={s.kicker}>SALES COMMAND CENTER</Text>
          <Text style={s.heroTitle}>
            Turn every lead into{`\n`}your next <Text style={s.blue}>win.</Text>
          </Text>
          <Text style={s.heroBody}>
            {d?.newLeads ?? 0} new leads are waiting in your pipeline.
          </Text>
          <View style={s.heroActions}>
            <Pressable
              style={s.primary}
              onPress={() => router.push("/(tabs)/leads")}
            >
              <Text style={s.primaryText}>Work leads</Text>
              <Ionicons name="arrow-forward" size={17} color="#fff" />
            </Pressable>
            <Pressable
              style={s.secondary}
              onPress={() => router.push("/(tabs)/inbox")}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={colors.green}
              />
              <Text style={s.secondaryText}>Inbox</Text>
            </Pressable>
          </View>
        </View>
        <View style={s.metrics}>
          <Metric
            icon="flash"
            value={d?.today ?? 0}
            label="Today"
            tone={colors.blue}
          />
          <Metric
            icon="person"
            value={d?.assigned ?? 0}
            label="Mine"
            tone={colors.green}
          />
          <Metric
            icon="chatbubble"
            value={d?.unread ?? 0}
            label="Unread"
            tone="#8B5CF6"
          />
        </View>
        <View style={s.sectionHead}>
          <View>
            <Text style={s.eyebrow}>LATEST ACTIVITY</Text>
            <Text style={s.sectionTitle}>Recent leads</Text>
          </View>
          <Pressable onPress={() => router.push("/(tabs)/leads")}>
            <Text style={s.seeAll}>View all</Text>
          </Pressable>
        </View>
        {query.isLoading ? (
          <View style={s.loadingList}>
            {[0, 1, 2].map((item) => (
              <View key={item} style={s.loadingLead}>
                <Skeleton width={44} height={44} />
                <View style={s.loadingCopy}>
                  <Skeleton width="62%" height={14} />
                  <Skeleton width="78%" height={11} />
                </View>
              </View>
            ))}
          </View>
        ) : query.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn’t load overview"
            body="Check your connection and pull down to try again."
          />
        ) : d?.recent.length ? (
          d.recent.map((lead, index) => (
            <Pressable
              key={lead.id}
              onPress={() => router.push(`/lead/${lead.id}`)}
              style={({ pressed }) => [s.lead, pressed && s.pressed]}
            >
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {(lead.name ?? "?")[0].toUpperCase()}
                </Text>
              </View>
              <View style={s.leadCopy}>
                <Text numberOfLines={1} style={s.leadName}>
                  {lead.name ?? "Unnamed lead"}
                </Text>
                <Text numberOfLines={1} style={s.leadMeta}>
                  {lead.email ?? lead.phone ?? "No contact details"}
                </Text>
              </View>
              <View style={s.leadEnd}>
                <StatusPill status={lead.status.name} />
                <Text style={s.time}>{index === 0 ? "Latest" : "Recent"}</Text>
              </View>
            </Pressable>
          ))
        ) : (
          <EmptyState
            icon="sparkles-outline"
            title="Your pipeline is ready"
            body="Connect Meta and enable a lead form to receive your first lead."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.navy },
  content: { backgroundColor: colors.canvas, paddingBottom: 28 },
  top: {
    height: 68,
    paddingHorizontal: 20,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bell: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.navySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#27436D",
  },
  alert: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
    borderWidth: 1,
    borderColor: colors.navySoft,
  },
  hero: {
    backgroundColor: colors.navy,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 34,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: colors.green,
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 35,
    lineHeight: 41,
    fontWeight: "900",
    letterSpacing: -1.2,
    color: "#fff",
  },
  blue: { color: colors.blue },
  heroBody: { color: "#AFC0DC", fontSize: 15, lineHeight: 22, marginTop: 12 },
  heroActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  primary: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  primaryText: { color: "#fff", fontWeight: "800" },
  secondary: {
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.navySoft,
    borderWidth: 1,
    borderColor: "#29446C",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  secondaryText: { color: "#fff", fontWeight: "700" },
  metrics: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 18,
    marginTop: 18,
  },
  metric: {
    flex: 1,
    minHeight: 116,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  metricValue: {
    fontSize: 27,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 9,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    marginTop: 1,
  },
  sectionHead: {
    paddingHorizontal: 20,
    marginTop: 28,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    color: colors.blue,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 3,
  },
  seeAll: { fontWeight: "800", color: colors.blue, padding: 5 },
  lead: {
    marginHorizontal: 18,
    marginBottom: 9,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 17, fontWeight: "900", color: colors.blueDark },
  leadCopy: { flex: 1, minWidth: 0 },
  leadName: { fontSize: 15, fontWeight: "800", color: colors.ink },
  leadMeta: { fontSize: 12, color: colors.muted, marginTop: 4 },
  leadEnd: { alignItems: "flex-end", gap: 5 },
  time: { fontSize: 10, color: colors.subtle },
  loadingList: { gap: 9, paddingHorizontal: 18 },
  loadingLead: {
    padding: 14,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    flexDirection: "row",
    gap: 12,
  },
  loadingCopy: { flex: 1, gap: 9, justifyContent: "center" },
});
