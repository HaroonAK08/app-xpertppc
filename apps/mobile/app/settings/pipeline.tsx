import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
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
import { colors, radius, statusColor } from "../../src/ui/theme";
type Stage = {
  id: string;
  name: string;
  key: string;
  position: number;
  isTerminal: boolean;
};
export default function Pipeline() {
  const [name, setName] = useState("");
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["lead-statuses"],
    queryFn: () => api<Stage[]>("/v1/lead-statuses"),
  });
  const create = useMutation({
    mutationFn: () =>
      api("/v1/lead-statuses", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          key: name
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9]+/g, "_"),
          position: query.data?.length ?? 0,
          isTerminal: false,
        }),
      }),
    onSuccess: () => {
      setName("");
      void cache.invalidateQueries({ queryKey: ["lead-statuses"] });
    },
  });
  const toggle = useMutation({
    mutationFn: (stage: Stage) =>
      api(`/v1/lead-statuses/${stage.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isTerminal: !stage.isTerminal }),
      }),
    onSuccess: () =>
      void cache.invalidateQueries({ queryKey: ["lead-statuses"] }),
  });
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Pipeline",
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.canvas },
        }}
      />
      <ScrollView contentContainerStyle={s.content}>
        <ScreenHeader eyebrow="SALES PROCESS" title="Pipeline stages" />
        <Text style={s.intro}>
          Keep stages clear and action-oriented so every teammate knows what
          should happen next.
        </Text>
        <View style={s.creator}>
          <Text style={s.creatorTitle}>Add a pipeline stage</Text>
          <View style={s.inputRow}>
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={50}
              placeholder="e.g. Follow-up"
              placeholderTextColor={colors.subtle}
              style={s.input}
            />
            <Pressable
              disabled={!name.trim() || create.isPending}
              onPress={() => create.mutate()}
              style={[s.add, !name.trim() && s.disabled]}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
          {create.isError && (
            <Notice>Could not create this stage. Use a unique name.</Notice>
          )}
        </View>
        <View style={s.head}>
          <Text style={s.section}>ACTIVE PIPELINE</Text>
          <Text style={s.count}>{query.data?.length ?? 0} stages</Text>
        </View>
        {query.isLoading ? (
          <ActivityIndicator color={colors.blue} />
        ) : query.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn’t load pipeline"
            body="Check your connection and try again."
          />
        ) : (
          query.data?.map((stage, index) => {
            const tone = statusColor(stage.name);
            return (
              <View key={stage.id} style={s.stage}>
                <View style={s.position}>
                  <Text style={s.positionText}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>
                </View>
                <View style={[s.stageDot, { backgroundColor: tone.fg }]} />
                <View style={s.stageCopy}>
                  <Text style={s.stageName}>{stage.name}</Text>
                  <Text style={s.stageMeta}>
                    {stage.isTerminal
                      ? "Terminal outcome"
                      : "Active follow-up stage"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => toggle.mutate(stage)}
                  style={[s.terminal, stage.isTerminal && s.terminalActive]}
                >
                  <Ionicons
                    name={stage.isTerminal ? "flag" : "flag-outline"}
                    size={15}
                    color={stage.isTerminal ? "#8A6411" : colors.subtle}
                  />
                </Pressable>
              </View>
            );
          })
        )}
        <Notice tone="info">
          Terminal stages close the active sales journey, such as Won or Lost.
        </Notice>
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
  creatorTitle: { fontSize: 14, fontWeight: "900", color: "#fff" },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: colors.navySoft,
    paddingHorizontal: 13,
    color: "#fff",
  },
  add: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.4 },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 27,
    marginBottom: 10,
  },
  section: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: colors.muted,
  },
  count: { fontSize: 10, color: colors.subtle },
  stage: {
    minHeight: 70,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  position: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  positionText: { fontSize: 10, fontWeight: "900", color: colors.muted },
  stageDot: { width: 8, height: 8, borderRadius: 4 },
  stageCopy: { flex: 1 },
  stageName: { fontSize: 14, fontWeight: "900", color: colors.ink },
  stageMeta: { fontSize: 10, color: colors.subtle, marginTop: 3 },
  terminal: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  terminalActive: { backgroundColor: "#FFF7DD" },
});
