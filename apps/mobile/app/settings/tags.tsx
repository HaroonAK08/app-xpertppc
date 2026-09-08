import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { EmptyState, ScreenHeader } from "../../src/ui/components";
import { Notice, PrimaryButton } from "../../src/ui/flows";
import { colors, radius } from "../../src/ui/theme";
type Tag = { id: string; name: string };
const palette = [
  ["#EAF3FF", "#0967D8"],
  ["#E7FAF1", "#078451"],
  ["#F1ECFF", "#7656D8"],
  ["#FFF4DE", "#9A6700"],
  ["#FFF0F0", "#C9363E"],
];
export default function Tags() {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["tags"],
    queryFn: () => api<Tag[]>("/v1/tags"),
  });
  const create = useMutation({
    mutationFn: () =>
      api("/v1/tags", {
        method: "POST",
        body: JSON.stringify({ name: name.trim() }),
      }),
    onSuccess: () => {
      setName("");
      void client.invalidateQueries({ queryKey: ["tags"] });
    },
  });
  const filtered = useMemo(
    () =>
      query.data?.filter((tag) =>
        tag.name.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [query.data, search],
  );
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Tags",
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.canvas },
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <ScreenHeader eyebrow="PIPELINE ORGANIZATION" title="Lead tags" />
        <Text style={s.intro}>
          Create a lightweight vocabulary your team can use to prioritize and
          segment leads.
        </Text>
        <View style={s.creator}>
          <View style={s.creatorHead}>
            <View style={s.hash}>
              <Text style={s.hashText}>#</Text>
            </View>
            <View>
              <Text style={s.creatorTitle}>Create a new tag</Text>
              <Text style={s.creatorMeta}>
                Short, recognizable names work best
              </Text>
            </View>
          </View>
          <View style={s.inputWrap}>
            <TextInput
              maxLength={50}
              value={name}
              onChangeText={setName}
              placeholder="e.g. High intent"
              placeholderTextColor={colors.subtle}
              style={s.input}
            />
            <Text style={s.limit}>{name.length}/50</Text>
          </View>
          {create.isError && (
            <Notice>
              This tag could not be created. It may already exist.
            </Notice>
          )}
          {create.isSuccess && (
            <Notice tone="success">Tag created and ready to use.</Notice>
          )}
          <PrimaryButton
            label="Create tag"
            icon="add"
            loading={create.isPending}
            disabled={name.trim().length < 1}
            onPress={() => create.mutate()}
          />
        </View>
        <View style={s.libraryHead}>
          <Text style={s.section}>TAG LIBRARY</Text>
          <Text style={s.count}>{query.data?.length ?? 0} total</Text>
        </View>
        <View style={s.searchWrap}>
          <Ionicons name="search" size={18} color={colors.subtle} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Find a tag"
            placeholderTextColor={colors.subtle}
            style={s.search}
          />
          {Boolean(search) && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={colors.subtle} />
            </Pressable>
          )}
        </View>
        {query.isLoading ? (
          <ActivityIndicator color={colors.blue} style={{ marginTop: 30 }} />
        ) : query.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn’t load tags"
            body="Check your connection and reopen this screen."
          />
        ) : filtered.length ? (
          <View style={s.wrap}>
            {filtered.map((tag, index) => {
              const tone = palette[index % palette.length];
              return (
                <View
                  key={tag.id}
                  style={[s.tag, { backgroundColor: tone[0] }]}
                >
                  <View style={[s.dot, { backgroundColor: tone[1] }]} />
                  <Text style={[s.tagText, { color: tone[1] }]}>
                    {tag.name}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <EmptyState
            icon="pricetags-outline"
            title={search ? "No matching tags" : "No tags yet"}
            body={
              search
                ? "Try another search term."
                : "Create your first tag to organize incoming leads."
            }
          />
        )}
        <View style={s.tip}>
          <Ionicons name="bulb-outline" size={18} color="#9A6700" />
          <Text style={s.tipText}>
            Keep the list focused. Five to twelve tags are usually enough for a
            fast-moving sales team.
          </Text>
        </View>
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
  creator: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 16,
    gap: 11,
  },
  creatorHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  hash: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: colors.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  hashText: { fontSize: 21, fontWeight: "900", color: colors.blue },
  creatorTitle: { fontSize: 15, fontWeight: "900", color: "#fff" },
  creatorMeta: { fontSize: 10, color: "#8095B6", marginTop: 3 },
  inputWrap: {
    height: 49,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: colors.navySoft,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, height: "100%", fontSize: 14, color: "#fff" },
  limit: { fontSize: 9, color: "#647A9D" },
  libraryHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 27,
    marginBottom: 10,
  },
  section: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: colors.muted,
  },
  count: { fontSize: 10, fontWeight: "700", color: colors.subtle },
  searchWrap: {
    height: 47,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  search: { flex: 1, height: "100%", fontSize: 14, color: colors.ink },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  tag: {
    height: 38,
    borderRadius: 999,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  tagText: { fontSize: 12, fontWeight: "800" },
  tip: {
    borderRadius: radius.md,
    backgroundColor: "#FFF8E8",
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginTop: 24,
  },
  tipText: { flex: 1, fontSize: 11, lineHeight: 17, color: "#7A5B13" },
});
