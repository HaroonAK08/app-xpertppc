import { Ionicons } from "@expo/vector-icons";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { flattenUniquePages } from "../../src/lib/pagination";
import {
  Avatar,
  EmptyState,
  ScreenHeader,
  StatusPill,
} from "../../src/ui/components";
import { PrimaryButton } from "../../src/ui/flows";
import { colors, radius } from "../../src/ui/theme";
type Lead = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
  source?: string;
  status: { name: string };
  assignedUser?: { name: string } | null;
};
type Page = { data: Lead[]; nextCursor: string | null };
type Member = { user: { id: string; name: string }; role: string };
type Tag = { id: string; name: string };
type Filters = {
  source: "" | "META_LEAD_AD" | "MANUAL";
  assignedUserId: string;
  tagId: string;
  sort: "newest" | "oldest";
};
const emptyFilters: Filters = {
  source: "",
  assignedUserId: "",
  tagId: "",
  sort: "newest",
};
const Choice = ({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) => (
  <Pressable onPress={onPress} style={[s.choice, selected && s.choiceActive]}>
    <Text style={[s.choiceText, selected && s.choiceTextActive]}>{label}</Text>
    {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
  </Pressable>
);
const LeadCard = memo(function LeadCard({ item }: { item: Lead }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name ?? "unnamed lead"}`}
      style={({ pressed }) => [s.card, pressed && s.pressed]}
      onPress={() => router.push(`/lead/${item.id}`)}
    >
      <Avatar name={item.name} />
      <View style={s.copy}>
        <View style={s.row}>
          <Text numberOfLines={1} style={s.name}>
            {item.name ?? "Unnamed lead"}
          </Text>
          <StatusPill status={item.status.name} />
        </View>
        <Text numberOfLines={1} style={s.contact}>
          {item.email ?? item.phone ?? "No contact details"}
        </Text>
        <View style={s.bottom}>
          <View style={s.assignee}>
            <Ionicons name="person-outline" size={12} color={colors.subtle} />
            <Text style={s.meta}>
              {item.assignedUser?.name ?? "Unassigned"}
            </Text>
          </View>
          <Text style={s.date}>
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={17} color={colors.subtle} />
    </Pressable>
  );
});
export default function Leads() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [statusId, setStatusId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [draft, setDraft] = useState<Filters>(filters);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  const statuses = useQuery({
    queryKey: ["lead-statuses"],
    queryFn: ({ signal }) =>
      api<Array<{ id: string; name: string }>>("/v1/lead-statuses", { signal }),
  });
  const members = useQuery({
    queryKey: ["team"],
    queryFn: ({ signal }) => api<Member[]>("/v1/team", { signal }),
    retry: false,
  });
  const tags = useQuery({
    queryKey: ["tags"],
    queryFn: ({ signal }) => api<Tag[]>("/v1/tags", { signal }),
  });
  const suffix = useMemo(
    () =>
      `${debounced ? `&search=${encodeURIComponent(debounced)}` : ""}${statusId ? `&statusId=${statusId}` : ""}${filters.source ? `&source=${filters.source}` : ""}${filters.assignedUserId ? `&assignedUserId=${filters.assignedUserId}` : ""}${filters.tagId ? `&tagId=${filters.tagId}` : ""}&sort=${filters.sort}`,
    [debounced, statusId, filters],
  );
  const query = useInfiniteQuery({
    queryKey: ["leads", { debounced, statusId, filters }],
    queryFn: ({ pageParam, signal }) =>
      api<Page>(
        `/v1/leads?limit=25${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}${suffix}`,
        { signal },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const leads = useMemo(
    () => flattenUniquePages(query.data?.pages),
    [query.data],
  );
  const activeCount = Object.entries(filters).filter(([key, value]) =>
    key === "sort" ? value !== "newest" : !!value,
  ).length;
  const showFilters = () => {
    setDraft(filters);
    setOpen(true);
  };
  const renderLead = useCallback(
    ({ item }: { item: Lead }) => <LeadCard item={item} />,
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
          eyebrow="YOUR PIPELINE"
          title="Leads"
          action={
            <Pressable
              accessibilityLabel="Lead filters"
              onPress={showFilters}
              style={[s.filterButton, activeCount > 0 && s.filterButtonActive]}
            >
              <Ionicons
                name="options-outline"
                size={22}
                color={activeCount > 0 ? "#fff" : colors.ink}
              />
              {activeCount > 0 && (
                <View style={s.filterCount}>
                  <Text style={s.filterCountText}>{activeCount}</Text>
                </View>
              )}
            </Pressable>
          }
        />
        <View style={s.searchWrap}>
          <Ionicons name="search" size={19} color={colors.subtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, email or phone"
            placeholderTextColor={colors.subtle}
            style={s.search}
          />
          {search.length > 0 && (
            <Pressable
              accessibilityLabel="Clear search"
              onPress={() => setSearch("")}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={19} color={colors.subtle} />
            </Pressable>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filters}
        >
          <Pressable
            style={[s.filter, !statusId && s.filterActive]}
            onPress={() => setStatusId(null)}
          >
            <Text style={[s.filterText, !statusId && s.filterTextActive]}>
              All
            </Text>
          </Pressable>
          {statuses.data?.map((status) => (
            <Pressable
              key={status.id}
              style={[s.filter, statusId === status.id && s.filterActive]}
              onPress={() => setStatusId(status.id)}
            >
              <Text
                style={[
                  s.filterText,
                  statusId === status.id && s.filterTextActive,
                ]}
              >
                {status.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={s.resultRow}>
          <Text style={s.result}>
            {leads.length} loaded · {filters.sort}
          </Text>
          {query.isFetching && !query.isFetchingNextPage && (
            <ActivityIndicator size="small" color={colors.blue} />
          )}
        </View>
      </View>
      <FlatList
        data={leads}
        keyExtractor={(x) => x.id}
        initialNumToRender={9}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={45}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
        onEndReachedThreshold={0.35}
        onEndReached={loadMore}
        contentContainerStyle={[s.list, !leads.length && s.listEmpty]}
        ListEmptyComponent={
          query.isLoading ? (
            <ActivityIndicator color={colors.blue} />
          ) : (
            <EmptyState
              icon={query.isError ? "cloud-offline-outline" : "people-outline"}
              title={query.isError ? "Couldn’t load leads" : "No leads found"}
              body={
                query.isError
                  ? "Check your connection and pull down to retry."
                  : "Try another search or clear your filters."
              }
              action={
                activeCount > 0 ? (
                  <Pressable onPress={() => setFilters(emptyFilters)}>
                    <Text style={s.clearLink}>Clear filters</Text>
                  </Pressable>
                ) : undefined
              }
            />
          )
        }
        renderItem={renderLead}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <ActivityIndicator color={colors.blue} style={{ margin: 18 }} />
          ) : null
        }
      />
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={s.scrim} onPress={() => setOpen(false)} />
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.sheetHead}>
            <View>
              <Text style={s.sheetEyebrow}>REFINE PIPELINE</Text>
              <Text style={s.sheetTitle}>Filter leads</Text>
            </View>
            <Pressable
              accessibilityLabel="Close filters"
              onPress={() => setOpen(false)}
              style={s.close}
            >
              <Ionicons name="close" size={21} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.sheetBody}
          >
            <Text style={s.groupLabel}>SOURCE</Text>
            <View style={s.choices}>
              <Choice
                label="Any source"
                selected={!draft.source}
                onPress={() => setDraft({ ...draft, source: "" })}
              />
              <Choice
                label="Meta Lead Ads"
                selected={draft.source === "META_LEAD_AD"}
                onPress={() => setDraft({ ...draft, source: "META_LEAD_AD" })}
              />
              <Choice
                label="Manual"
                selected={draft.source === "MANUAL"}
                onPress={() => setDraft({ ...draft, source: "MANUAL" })}
              />
            </View>
            <Text style={s.groupLabel}>SORT ORDER</Text>
            <View style={s.choices}>
              <Choice
                label="Newest first"
                selected={draft.sort === "newest"}
                onPress={() => setDraft({ ...draft, sort: "newest" })}
              />
              <Choice
                label="Oldest first"
                selected={draft.sort === "oldest"}
                onPress={() => setDraft({ ...draft, sort: "oldest" })}
              />
            </View>
            {members.data?.length ? (
              <>
                <Text style={s.groupLabel}>OWNER</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.choices}
                >
                  <Choice
                    label="Anyone"
                    selected={!draft.assignedUserId}
                    onPress={() => setDraft({ ...draft, assignedUserId: "" })}
                  />
                  {members.data.map((m) => (
                    <Choice
                      key={m.user.id}
                      label={m.user.name}
                      selected={draft.assignedUserId === m.user.id}
                      onPress={() =>
                        setDraft({ ...draft, assignedUserId: m.user.id })
                      }
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}
            {tags.data?.length ? (
              <>
                <Text style={s.groupLabel}>TAG</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.choices}
                >
                  <Choice
                    label="Any tag"
                    selected={!draft.tagId}
                    onPress={() => setDraft({ ...draft, tagId: "" })}
                  />
                  {tags.data.map((tag) => (
                    <Choice
                      key={tag.id}
                      label={`# ${tag.name}`}
                      selected={draft.tagId === tag.id}
                      onPress={() => setDraft({ ...draft, tagId: tag.id })}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}
          </ScrollView>
          <View style={s.sheetActions}>
            <Pressable onPress={() => setDraft(emptyFilters)} style={s.reset}>
              <Text style={s.resetText}>Reset</Text>
            </Pressable>
            <View style={{ flex: 1 }}>
              <PrimaryButton
                label="Apply filters"
                icon="checkmark"
                onPress={() => {
                  setFilters(draft);
                  setOpen(false);
                }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  header: {
    backgroundColor: colors.canvas,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 13,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  filterCount: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.canvas,
  },
  filterCountText: { fontSize: 8, fontWeight: "900", color: colors.navy },
  searchWrap: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  search: { flex: 1, fontSize: 15, color: colors.ink },
  filters: { gap: 8, paddingRight: 18 },
  filter: {
    height: 35,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    justifyContent: "center",
  },
  filterActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText: { fontSize: 12, fontWeight: "700", color: colors.muted },
  filterTextActive: { color: "#fff" },
  resultRow: {
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  result: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.subtle,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  list: { paddingHorizontal: 18, paddingBottom: 28, gap: 9 },
  listEmpty: { flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: { flex: 1, fontSize: 15, fontWeight: "800", color: colors.ink },
  contact: { fontSize: 13, color: colors.muted },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  assignee: { flexDirection: "row", alignItems: "center", gap: 4 },
  meta: { fontSize: 11, color: colors.subtle },
  date: { fontSize: 11, color: colors.subtle },
  clearLink: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.blue,
    marginTop: 8,
  },
  scrim: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(7,21,47,.55)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "82%",
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 9,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: "center",
  },
  sheetHead: {
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetEyebrow: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.4,
    color: colors.blue,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 3,
  },
  close: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetBody: { paddingHorizontal: 18, paddingBottom: 15, gap: 10 },
  groupLabel: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
    color: colors.muted,
    marginTop: 9,
  },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  choiceActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  choiceText: { fontSize: 11, fontWeight: "700", color: colors.muted },
  choiceTextActive: { color: "#fff" },
  sheetActions: {
    padding: 18,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  reset: { height: 54, paddingHorizontal: 18, justifyContent: "center" },
  resetText: { fontSize: 13, fontWeight: "800", color: colors.muted },
});
