import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { flattenUniquePages } from "../../src/lib/pagination";
import { Avatar, EmptyState, ScreenHeader } from "../../src/ui/components";
import { colors, radius } from "../../src/ui/theme";
type Filter = "all" | "unread" | "mine";
type Conversation = {
  id: string;
  channel: string;
  lastMessageAt: string | null;
  unread: boolean;
  lead?: { name: string | null } | null;
  messages: Array<{ content: string }>;
  assignedUser?: { name: string } | null;
};
type Page = { data: Conversation[]; nextCursor: string | null };
const formatTime = (value: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  return date.toDateString() === today.toDateString()
    ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
};
const ConversationCard = memo(function ConversationCard({
  item,
}: {
  item: Conversation;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.unread ? "Unread conversation" : "Conversation"} with ${item.lead?.name ?? "contact"}`}
      style={({ pressed }) => [
        s.card,
        item.unread && s.unreadCard,
        pressed && s.pressed,
      ]}
      onPress={() => router.push(`/conversation/${item.id}`)}
    >
      <View>
        <Avatar name={item.lead?.name} />
        {Boolean(item.unread) && <View style={s.unreadDot} />}
      </View>
      <View style={s.copy}>
        <View style={s.row}>
          <Text numberOfLines={1} style={[s.name, item.unread && s.bold]}>
            {item.lead?.name ?? "Messenger contact"}
          </Text>
          <Text style={[s.time, item.unread && s.timeUnread]}>
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={[s.preview, item.unread && s.previewUnread]}
        >
          {item.messages[0]?.content ?? "No messages"}
        </Text>
        <View style={s.metaRow}>
          <View style={s.channel}>
            <Ionicons name="logo-facebook" size={12} color={colors.blue} />
            <Text style={s.meta}>{item.channel}</Text>
          </View>
          <Text style={s.meta}>·</Text>
          <Text numberOfLines={1} style={s.meta}>
            {item.assignedUser?.name ?? "Unassigned"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
export default function Inbox() {
  const [filter, setFilter] = useState<Filter>("all");
  const query = useInfiniteQuery({
    queryKey: ["conversations", filter],
    queryFn: ({ pageParam, signal }) =>
      api<Page>(
        `/v1/conversations?filter=${filter}${pageParam ? `&cursor=${pageParam}` : ""}`,
        { signal },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
  });
  const rows = useMemo(
    () => flattenUniquePages(query.data?.pages),
    [query.data],
  );
  const renderConversation = useCallback(
    ({ item }: { item: Conversation }) => <ConversationCard item={item} />,
    [],
  );
  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage)
      void query.fetchNextPage();
  }, [query]);
  return (
    <SafeAreaView style={s.page}>
      <View style={s.header}>
        <ScreenHeader
          eyebrow="CUSTOMER CONVERSATIONS"
          title="Inbox"
          action={
            <View style={s.live}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>Live</Text>
            </View>
          }
        />
        <View style={s.tabs}>
          {(
            [
              ["all", "All"],
              ["unread", "Unread"],
              ["mine", "Assigned to me"],
            ] as const
          ).map(([key, label]) => (
            <Pressable
              key={key}
              style={[s.tab, filter === key && s.tabActive]}
              onPress={() => setFilter(key)}
            >
              <Text style={[s.tabText, filter === key && s.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(x) => x.id}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={45}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        contentContainerStyle={[s.list, !rows.length && s.listEmpty]}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        onEndReachedThreshold={0.35}
        onEndReached={loadMore}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={colors.blue} />
          ) : (
            <EmptyState
              icon={
                query.isError ? "cloud-offline-outline" : "chatbubbles-outline"
              }
              title={
                query.isError
                  ? "Couldn’t load inbox"
                  : filter === "unread"
                    ? "You’re all caught up"
                    : "No conversations yet"
              }
              body={
                query.isError
                  ? "Check your connection and pull down to retry."
                  : "New supported conversations will appear here in real time."
              }
            />
          )
        }
        renderItem={renderConversation}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.blue} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 12, gap: 17 },
  live: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: radius.pill,
    backgroundColor: colors.greenSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#078451",
    textTransform: "uppercase",
  },
  tabs: {
    height: 42,
    padding: 4,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  tabTextActive: { color: colors.ink },
  list: { paddingHorizontal: 18, paddingBottom: 28, gap: 8 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  card: {
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    gap: 12,
  },
  unreadCard: { borderColor: "#BBD9FF", backgroundColor: "#FBFDFF" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  unreadDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  name: { flex: 1, fontSize: 15, color: colors.ink },
  bold: { fontWeight: "900" },
  time: { fontSize: 11, color: colors.subtle },
  timeUnread: { color: colors.blue, fontWeight: "800" },
  preview: { fontSize: 13, color: colors.muted },
  previewUnread: { color: colors.ink, fontWeight: "600" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  channel: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { fontSize: 10, color: colors.subtle, textTransform: "capitalize" },
});
