import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { EmptyState } from "../../src/ui/components";
import {
  Notice,
  OnboardingShell,
  PrimaryButton,
  SelectionCard,
} from "../../src/ui/flows";
import { colors } from "../../src/ui/theme";
type Form = { id: string; name: string; status: string };
export default function SelectForm() {
  const client = useQueryClient();
  const forms = useQuery({
    queryKey: ["meta-forms"],
    queryFn: () => api<Form[]>("/v1/integrations/meta/forms"),
  });
  const enable = useMutation({
    mutationFn: (id: string) =>
      api(`/v1/integrations/meta/forms/${id}/enable`, { method: "POST" }),
    onSuccess: () =>
      void client.invalidateQueries({ queryKey: ["meta-forms"] }),
  });
  const active = forms.data?.filter((f) => f.status === "ACTIVE").length ?? 0;
  return (
    <OnboardingShell
      step={3}
      title={"Pick the forms\nthat matter."}
      body="Enable one or more forms. Every new submission will land in your pipeline automatically."
    >
      {forms.isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.blue} />
          <Text style={s.loadingText}>Loading lead forms…</Text>
        </View>
      ) : forms.isError ? (
        <>
          <Notice>Forms could not be loaded from the selected Page.</Notice>
          <PrimaryButton
            label="Try again"
            icon="refresh"
            onPress={() => void forms.refetch()}
          />
        </>
      ) : forms.data?.length ? (
        forms.data.map((form) => (
          <SelectionCard
            key={form.id}
            icon="document-text-outline"
            title={form.name}
            subtitle={
              form.status === "ACTIVE"
                ? "Enabled and receiving leads"
                : "Tap to enable"
            }
            selected={form.status === "ACTIVE"}
            disabled={enable.isPending}
            onPress={() => {
              if (form.status !== "ACTIVE") enable.mutate(form.id);
            }}
          />
        ))
      ) : (
        <EmptyState
          icon="documents-outline"
          title="No lead forms found"
          body="Create or publish a Lead Ads form for the selected Facebook Page."
        />
      )}
      {enable.isError && (
        <Notice>A form could not be enabled. Try again.</Notice>
      )}
      {forms.data?.length ? (
        <View style={s.footer}>
          <View style={s.summary}>
            <View style={s.liveDot} />
            <Text style={s.summaryText}>
              {active} {active === 1 ? "form" : "forms"} enabled
            </Text>
          </View>
          <PrimaryButton
            label="Open my dashboard"
            icon="grid-outline"
            disabled={active === 0}
            onPress={() => router.replace("/(tabs)/home")}
          />
        </View>
      ) : null}
      <Pressable onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={15} color="#8EC3FF" />
        <Text style={s.backText}>Choose another Page</Text>
      </Pressable>
    </OnboardingShell>
  );
}
const s = StyleSheet.create({
  loading: { paddingVertical: 45, alignItems: "center", gap: 13 },
  loadingText: { fontSize: 12, color: "#8FA3C1" },
  footer: { gap: 11, marginTop: 4 },
  summary: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.green,
  },
  summaryText: { fontSize: 11, fontWeight: "800", color: "#AFC0DC" },
  back: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  backText: { fontSize: 12, fontWeight: "700", color: "#8EC3FF" },
});
