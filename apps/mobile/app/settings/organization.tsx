import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { ScreenHeader } from "../../src/ui/components";
import { Notice, PrimaryButton } from "../../src/ui/flows";
import { colors, radius } from "../../src/ui/theme";
type Organization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
};
export default function OrganizationSettings() {
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: ["organization"],
    queryFn: () => api<Organization>("/v1/organizations/current"),
  });
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  useEffect(() => {
    if (query.data) {
      setName(query.data.name);
      setTimezone(query.data.timezone);
    }
  }, [query.data]);
  const save = useMutation({
    mutationFn: () =>
      api<Organization>("/v1/organizations/current", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim(), timezone: timezone.trim() }),
      }),
    onSuccess: () => {
      void cache.invalidateQueries({ queryKey: ["organization"] });
      void cache.invalidateQueries({ queryKey: ["me"] });
    },
  });
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Organization",
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.canvas },
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.content}
      >
        <ScreenHeader eyebrow="WORKSPACE IDENTITY" title="Organization" />
        <Text style={s.intro}>
          Keep the workspace identity and reporting timezone accurate for your
          whole team.
        </Text>
        {query.isLoading ? (
          <ActivityIndicator color={colors.blue} />
        ) : (
          <View style={s.card}>
            <View style={s.identity}>
              <View style={s.mark}>
                <Text style={s.markText}>{(name || "?")[0].toUpperCase()}</Text>
              </View>
              <View>
                <Text style={s.identityName}>{name || "Organization"}</Text>
                <Text style={s.slug}>{query.data?.slug}</Text>
              </View>
            </View>
            <Text style={s.label}>ORGANIZATION NAME</Text>
            <View style={s.inputWrap}>
              <Ionicons
                name="business-outline"
                size={18}
                color={colors.subtle}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={100}
                style={s.input}
              />
            </View>
            <Text style={s.label}>IANA TIMEZONE</Text>
            <View style={s.inputWrap}>
              <Ionicons name="time-outline" size={18} color={colors.subtle} />
              <TextInput
                value={timezone}
                onChangeText={setTimezone}
                autoCapitalize="none"
                placeholder="Asia/Karachi"
                placeholderTextColor={colors.subtle}
                style={s.input}
              />
            </View>
            <Text style={s.help}>
              Examples: Asia/Karachi, America/New_York, Europe/London
            </Text>
            {save.isError && (
              <Notice>Could not save. Enter a valid IANA timezone.</Notice>
            )}
            {save.isSuccess && (
              <Notice tone="success">Organization settings updated.</Notice>
            )}
            <PrimaryButton
              label="Save changes"
              icon="checkmark"
              loading={save.isPending}
              disabled={name.trim().length < 2 || timezone.trim().length < 3}
              onPress={() => save.mutate()}
            />
          </View>
        )}
        <View style={s.security}>
          <Ionicons name="shield-checkmark" size={20} color={colors.green} />
          <View style={{ flex: 1 }}>
            <Text style={s.securityTitle}>Tenant protected</Text>
            <Text style={s.securityBody}>
              Changing these details never changes your organization ID or data
              boundaries.
            </Text>
          </View>
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
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 10,
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  mark: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: { fontSize: 21, fontWeight: "900", color: colors.blue },
  identityName: { fontSize: 16, fontWeight: "900", color: colors.ink },
  slug: { fontSize: 10, color: colors.subtle, marginTop: 3 },
  label: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: colors.muted,
    marginTop: 5,
  },
  inputWrap: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.canvas,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: { flex: 1, height: "100%", fontSize: 14, color: colors.ink },
  help: { fontSize: 10, lineHeight: 15, color: colors.subtle },
  security: {
    marginTop: 18,
    borderRadius: radius.md,
    backgroundColor: colors.greenSoft,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  securityTitle: { fontSize: 12, fontWeight: "900", color: "#078451" },
  securityBody: {
    fontSize: 10,
    lineHeight: 15,
    color: "#32745A",
    marginTop: 3,
  },
});
