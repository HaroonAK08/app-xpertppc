import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../src/services/api/client";
import { EmptyState, ScreenHeader } from "../src/ui/components";
import { colors, radius } from "../src/ui/theme";
type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  dataJson?: { leadId?: string };
  readAt: string | null;
  createdAt: string;
};
export default function Notifications() {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<Notification[]>("/v1/notifications"),
  });
  const refresh = () =>
    cache.invalidateQueries({ queryKey: ["notifications"] });
  const read = useMutation({
    mutationFn: (id: string) =>
      api(`/v1/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => void refresh(),
  });
  const readAll = useMutation({
    mutationFn: () => api("/v1/notifications/read-all", { method: "POST" }),
    onSuccess: () => void refresh(),
  });
  const open = (item: Notification) => {
    if (!item.readAt) read.mutate(item.id);
    if (item.dataJson?.leadId) router.push(`/lead/${item.dataJson.leadId}`);
  };
  const unread = query.data?.filter((x) => !x.readAt).length ?? 0;
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Notifications",
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.canvas },
        }}
      />
      <View style={s.header}>
        <ScreenHeader
          eyebrow="REALTIME UPDATES"
          title="Notifications"
          action={
            unread > 0 ? (
              <Pressable onPress={() => readAll.mutate()}>
                <Text style={s.readAll}>Mark all read</Text>
              </Pressable>
            ) : undefined
          }
        />
        <Text style={s.summary}>
          {unread
            ? `${unread} update${unread === 1 ? "" : "s"} need your attention`
            : "You’re all caught up"}
        </Text>
      </View>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(x) => x.id}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        contentContainerStyle={[s.list, !query.data?.length && s.empty]}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={colors.blue} />
          ) : (
            <EmptyState
              icon={
                query.isError
                  ? "cloud-offline-outline"
                  : "notifications-outline"
              }
              title={
                query.isError ? "Couldn’t load notifications" : "Nothing new"
              }
              body={
                query.isError
                  ? "Check your connection and pull down to retry."
                  : "Lead and conversation updates will appear here."
              }
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => open(item)}
            style={({ pressed }) => [
              s.item,
              !item.readAt && s.unread,
              pressed && s.pressed,
            ]}
          >
            <View style={[s.icon, !item.readAt && s.iconUnread]}>
              <Ionicons
                name={
                  item.type.includes("LEAD")
                    ? "person-add-outline"
                    : "notifications-outline"
                }
                size={20}
                color={colors.blue}
              />
            </View>
            <View style={s.copy}>
              <View style={s.row}>
                <Text
                  numberOfLines={1}
                  style={[s.title, !item.readAt && s.bold]}
                >
                  {item.title}
                </Text>
                <Text style={s.time}>
                  {new Date(item.createdAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
              <Text style={s.body}>{item.body}</Text>
            </View>
            {!item.readAt && <View style={s.dot} />}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  header: { padding: 18, paddingTop: 14, paddingBottom: 12 },
  readAll: { fontSize: 11, fontWeight: "800", color: colors.blue, padding: 7 },
  summary: { fontSize: 12, color: colors.muted, marginTop: 5 },
  list: { paddingHorizontal: 18, paddingBottom: 30, gap: 8 },
  empty: { flexGrow: 1, justifyContent: "center" },
  item: {
    minHeight: 82,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  unread: { borderColor: "#BBD9FF", backgroundColor: "#FBFDFF" },
  pressed: { opacity: 0.7 },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  iconUnread: { backgroundColor: colors.blueSoft },
  copy: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, fontSize: 14, color: colors.ink },
  bold: { fontWeight: "900" },
  time: { fontSize: 9, color: colors.subtle },
  body: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.blue },
});
