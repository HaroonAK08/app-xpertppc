import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
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
type Page = {
  id: string;
  name: string;
  status: string;
  externalPageId?: string;
};
export default function SelectPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const pages = useQuery({
    queryKey: ["meta-pages"],
    queryFn: () => api<Page[]>("/v1/integrations/meta/pages"),
  });
  const select = useMutation({
    mutationFn: (id: string) =>
      api(`/v1/integrations/meta/pages/${id}/select`, { method: "POST" }),
    onSuccess: () => router.push("/(onboarding)/select-form"),
  });
  return (
    <OnboardingShell
      step={2}
      title={"Choose your\nFacebook Page."}
      body="Select the Page whose Lead Ads you want to capture. You can change this later in Settings."
    >
      {pages.isLoading ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.blue} />
          <Text style={s.loadingText}>Finding your Pages…</Text>
        </View>
      ) : pages.isError ? (
        <>
          <Notice>
            Pages could not be loaded. Complete Facebook authorization, then try
            again.
          </Notice>
          <PrimaryButton
            label="Try again"
            icon="refresh"
            onPress={() => void pages.refetch()}
          />
        </>
      ) : pages.data?.length ? (
        pages.data.map((page) => (
          <SelectionCard
            key={page.id}
            icon="flag-outline"
            title={page.name}
            subtitle={
              page.status === "ACTIVE"
                ? "Currently selected"
                : "Facebook business Page"
            }
            selected={
              selected === page.id || (!selected && page.status === "ACTIVE")
            }
            onPress={() => setSelected(page.id)}
          />
        ))
      ) : (
        <EmptyState
          icon="flag-outline"
          title="No Pages found"
          body="Make sure your Facebook account can manage at least one business Page."
        />
      )}
      {pages.data?.length ? (
        <PrimaryButton
          label="Use this Page"
          loading={select.isPending}
          disabled={!selected && !pages.data.some((p) => p.status === "ACTIVE")}
          onPress={() => {
            const id =
              selected ?? pages.data.find((p) => p.status === "ACTIVE")?.id;
            if (id) select.mutate(id);
          }}
        />
      ) : null}
      <Pressable onPress={() => router.back()} style={s.back}>
        <Ionicons name="arrow-back" size={15} color="#8EC3FF" />
        <Text style={s.backText}>Reconnect another account</Text>
      </Pressable>
    </OnboardingShell>
  );
}
const s = StyleSheet.create({
  loading: { paddingVertical: 45, alignItems: "center", gap: 13 },
  loadingText: { fontSize: 12, color: "#8FA3C1" },
  back: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  backText: { fontSize: 12, fontWeight: "700", color: "#8EC3FF" },
});
