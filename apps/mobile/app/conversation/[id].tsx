import { Ionicons } from "@expo/vector-icons";
import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { flattenUniquePages } from "../../src/lib/pagination";
import { EmptyState } from "../../src/ui/components";
import { colors, radius } from "../../src/ui/theme";
type Message = {
  id: string;
  content: string;
  direction: "INBOUND" | "OUTBOUND";
  status: string;
  createdAt: string;
};
type Page = { data: Message[]; nextCursor: string | null };
const MessageBubble = memo(function MessageBubble({
  item,
  retrying,
  onRetry,
}: {
  item: Message;
  retrying: boolean;
  onRetry: (id: string) => void;
}) {
  return (
    <View
      accessibilityLabel={`${item.direction === "OUTBOUND" ? "Sent" : "Received"} message: ${item.content}`}
      style={[
        s.bubble,
        item.direction === "OUTBOUND" ? s.outbound : s.inbound,
        item.status === "PENDING" && s.pending,
      ]}
    >
      <Text style={[s.message, item.direction === "OUTBOUND" && s.outText]}>
        {item.content}
      </Text>
      <View style={s.messageMeta}>
        <Text style={[s.time, item.direction === "OUTBOUND" && s.outTime]}>
          {new Date(item.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
        {item.direction === "OUTBOUND" && (
          <Ionicons
            name={
              item.status === "FAILED"
                ? "alert-circle"
                : item.status === "PENDING"
                  ? "time-outline"
                  : "checkmark-done"
            }
            size={13}
            color={item.status === "FAILED" ? "#FFD0D2" : "#B9DCFF"}
          />
        )}
      </View>
      {item.status === "FAILED" && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retry failed message"
          disabled={retrying}
          style={s.retryButton}
          onPress={() => onRetry(item.id)}
        >
          <Ionicons name="refresh" size={13} color="#fff" />
          <Text style={s.retry}>Retry message</Text>
        </Pressable>
      )}
    </View>
  );
});
export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useQueryClient();
  const [text, setText] = useState("");
  const query = useInfiniteQuery({
    queryKey: ["conversations", id, "messages"],
    queryFn: ({ pageParam, signal }) =>
      api<Page>(
        `/v1/conversations/${id}/messages${pageParam ? `?cursor=${pageParam}` : ""}`,
        { signal },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (p) => p.nextCursor,
    enabled: !!id,
  });
  useEffect(() => {
    if (id) void api(`/v1/conversations/${id}/read`, { method: "POST" });
  }, [id]);
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["conversations", id, "messages"] });
  const send = useMutation({
    mutationFn: (content: string) =>
      api<Message>(`/v1/conversations/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onMutate: async (content) => {
      const key = ["conversations", id, "messages"] as const;
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<InfiniteData<Page>>(key);
      const optimisticId = `pending-${Date.now()}`;
      const optimistic: Message = {
        id: optimisticId,
        content,
        direction: "OUTBOUND",
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      client.setQueryData<InfiniteData<Page>>(key, (current) => {
        if (!current) return current;
        const [first, ...rest] = current.pages;
        if (!first) return current;
        return {
          ...current,
          pages: [{ ...first, data: [optimistic, ...first.data] }, ...rest],
        };
      });
      setText("");
      return { previous, optimisticId, content };
    },
    onError: (_error, _content, context) => {
      if (context?.previous)
        client.setQueryData(
          ["conversations", id, "messages"],
          context.previous,
        );
      if (context?.content) setText(context.content);
    },
    onSuccess: (message, _content, context) => {
      const key = ["conversations", id, "messages"] as const;
      client.setQueryData<InfiniteData<Page>>(key, (current) =>
        current
          ? {
              ...current,
              pages: current.pages.map((page) => ({
                ...page,
                data: page.data.map((item) =>
                  item.id === context?.optimisticId ? message : item,
                ),
              })),
            }
          : current,
      );
      void client.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const retry = useMutation({
    mutationFn: (messageId: string) =>
      api<Message>(`/v1/conversations/${id}/messages/${messageId}/retry`, {
        method: "POST",
      }),
    onSuccess: () => void refresh(),
  });
  const messages = useMemo(
    () => flattenUniquePages(query.data?.pages),
    [query.data],
  );
  const retryMessage = useCallback(
    (messageId: string) => retry.mutate(messageId),
    [retry],
  );
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble
        item={item}
        retrying={retry.isPending}
        onRetry={retryMessage}
      />
    ),
    [retry.isPending, retryMessage],
  );
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Conversation",
          headerTintColor: colors.ink,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.surface },
        }}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        {query.isLoading ? (
          <ActivityIndicator color={colors.blue} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            inverted
            data={messages}
            keyExtractor={(x) => x.id}
            initialNumToRender={14}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={40}
            windowSize={9}
            removeClippedSubviews={Platform.OS === "android"}
            contentContainerStyle={[s.list, !messages.length && s.emptyList]}
            onEndReached={() => {
              if (query.hasNextPage) void query.fetchNextPage();
            }}
            ListEmptyComponent={
              <EmptyState
                icon="chatbubble-outline"
                title="Start the conversation"
                body="Supported messages will appear here."
              />
            }
            renderItem={renderMessage}
          />
        )}
        <View style={s.composerWrap}>
          {send.isError && (
            <Text style={s.error}>Message could not be queued. Try again.</Text>
          )}
          <View style={s.composer}>
            <Pressable accessibilityLabel="Add attachment" style={s.add}>
              <Ionicons name="add" size={23} color={colors.blue} />
            </Pressable>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={setText}
              placeholder="Write a reply…"
              placeholderTextColor={colors.subtle}
              multiline
            />
            <Pressable
              accessibilityLabel="Send message"
              disabled={!text.trim() || send.isPending}
              style={[s.send, (!text.trim() || send.isPending) && s.disabled]}
              onPress={() => send.mutate(text.trim())}
            >
              <Ionicons name="arrow-up" size={21} color="#fff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  list: { padding: 16, gap: 8 },
  emptyList: { flexGrow: 1, justifyContent: "center" },
  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 18,
    gap: 5,
  },
  inbound: {
    backgroundColor: colors.surface,
    alignSelf: "flex-start",
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: colors.line,
  },
  outbound: {
    backgroundColor: colors.blue,
    alignSelf: "flex-end",
    borderBottomRightRadius: 5,
  },
  pending: { opacity: 0.76 },
  message: { fontSize: 14, lineHeight: 20, color: colors.ink },
  outText: { color: "#fff" },
  messageMeta: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 4,
  },
  time: { fontSize: 9, color: colors.subtle },
  outTime: { color: "#B9DCFF" },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  retry: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  composerWrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 8 : 12,
  },
  composer: {
    minHeight: 50,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    padding: 6,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
  },
  add: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 38,
    paddingHorizontal: 5,
    paddingVertical: 9,
    fontSize: 14,
    color: colors.ink,
  },
  send: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.4 },
  error: {
    color: colors.danger,
    fontSize: 11,
    textAlign: "center",
    marginBottom: 7,
  },
});
