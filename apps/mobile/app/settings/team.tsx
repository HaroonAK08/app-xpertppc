import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "../../src/services/api/client";
import { Avatar, EmptyState, ScreenHeader } from "../../src/ui/components";
import { Notice, PrimaryButton } from "../../src/ui/flows";
import { colors, radius } from "../../src/ui/theme";
type Role = "ADMIN" | "MANAGER" | "AGENT" | "VIEWER";
type Member = {
  role: Role | "OWNER";
  status: string;
  user: { id: string; name: string; email: string };
};
const roles: Role[] = ["ADMIN", "MANAGER", "AGENT", "VIEWER"];
const roleDescriptions: Record<Role, string> = {
  ADMIN: "Manage people, integrations, and CRM settings",
  MANAGER: "Assign leads and manage team activity",
  AGENT: "Work assigned leads, notes, and messages",
  VIEWER: "Read-only access to workspace data",
};
export default function Team() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("AGENT");
  const [editing, setEditing] = useState<Member | null>(null);
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: ["team"] });
  const query = useQuery({
    queryKey: ["team"],
    queryFn: () => api<Member[]>("/v1/team"),
  });
  const invite = useMutation({
    mutationFn: () =>
      api("/v1/team/invite", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }),
    onSuccess: () => {
      setEmail("");
      void refresh();
    },
  });
  const update = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      api(`/v1/team/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      setEditing(null);
      void refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/v1/team/${id}`, { method: "DELETE" }),
    onSuccess: () => void refresh(),
  });
  const confirmRemove = (member: Member) =>
    Alert.alert(
      "Remove team member?",
      `${member.user.name} will immediately lose access to this workspace.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => remove.mutate(member.user.id),
        },
      ],
    );
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Team",
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerStyle: { backgroundColor: colors.canvas },
        }}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <ScreenHeader eyebrow="ACCESS & OWNERSHIP" title="Your team" />
        <Text style={s.intro}>
          Invite teammates and give each person only the access they need.
        </Text>
        <View style={s.inviteCard}>
          <View style={s.inviteHead}>
            <View style={s.inviteIcon}>
              <Ionicons name="person-add" size={20} color={colors.blue} />
            </View>
            <View>
              <Text style={s.cardTitle}>Invite a teammate</Text>
              <Text style={s.cardMeta}>
                An email invitation expires in 7 days
              </Text>
            </View>
          </View>
          <Text style={s.label}>WORK EMAIL</Text>
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.subtle} />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              placeholder="teammate@company.com"
              placeholderTextColor={colors.subtle}
              style={s.input}
            />
          </View>
          <Text style={s.label}>ROLE</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.roles}
          >
            {roles.map((item) => (
              <Pressable
                key={item}
                onPress={() => setRole(item)}
                style={[s.role, role === item && s.roleActive]}
              >
                <Text style={[s.roleText, role === item && s.roleTextActive]}>
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {invite.isError && (
            <Notice>
              Invitation could not be sent. Check the address and plan limits.
            </Notice>
          )}
          {invite.isSuccess && (
            <Notice tone="success">Invitation queued successfully.</Notice>
          )}
          <PrimaryButton
            label="Send invitation"
            icon="send-outline"
            loading={invite.isPending}
            disabled={!email.includes("@")}
            onPress={() => invite.mutate()}
          />
        </View>
        <View style={s.listHead}>
          <Text style={s.section}>MEMBERS</Text>
          <View style={s.count}>
            <Text style={s.countText}>{query.data?.length ?? 0}</Text>
          </View>
        </View>
        {query.isLoading ? (
          <ActivityIndicator color={colors.blue} />
        ) : query.isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn’t load team"
            body="Pull back and reopen this screen to retry."
          />
        ) : (
          query.data?.map((member) => (
            <View key={member.user.id} style={s.member}>
              <Avatar name={member.user.name} />
              <View style={s.memberCopy}>
                <Text style={s.memberName}>{member.user.name}</Text>
                <Text numberOfLines={1} style={s.memberEmail}>
                  {member.user.email}
                </Text>
                <View style={s.memberMeta}>
                  <View
                    style={[
                      s.statusDot,
                      member.status === "ACTIVE" && s.statusActive,
                    ]}
                  />
                  <Text style={s.memberStatus}>{member.status}</Text>
                </View>
              </View>
              {member.role === "OWNER" ? (
                <View style={s.owner}>
                  <Ionicons name="key" size={11} color="#8A6411" />
                  <Text style={s.ownerText}>OWNER</Text>
                </View>
              ) : (
                <View style={s.actions}>
                  <Pressable
                    accessibilityLabel={`Change role for ${member.user.name}`}
                    onPress={() => setEditing(member)}
                    style={s.roleButton}
                  >
                    <Text style={s.currentRole}>{member.role}</Text>
                    <Ionicons
                      name="chevron-down"
                      size={13}
                      color={colors.blue}
                    />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Remove ${member.user.name}`}
                    onPress={() => confirmRemove(member)}
                    style={s.remove}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
      <Modal
        visible={Boolean(editing)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(null)}
      >
        <Pressable style={s.backdrop} onPress={() => setEditing(null)}>
          <Pressable style={s.sheet} onPress={() => undefined}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>Choose a role</Text>
            <Text style={s.sheetBody}>
              Set the right level of access for {editing?.user.name}.
            </Text>
            {roles.map((item) => {
              const selected = editing?.role === item;
              return (
                <Pressable
                  key={item}
                  disabled={update.isPending}
                  onPress={() =>
                    editing &&
                    update.mutate({ id: editing.user.id, role: item })
                  }
                  style={[s.roleOption, selected && s.roleOptionSelected]}
                >
                  <View style={s.roleOptionCopy}>
                    <Text style={s.roleOptionTitle}>{item}</Text>
                    <Text style={s.roleOptionBody}>
                      {roleDescriptions[item]}
                    </Text>
                  </View>
                  {update.isPending && selected ? (
                    <ActivityIndicator size="small" color={colors.blue} />
                  ) : (
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={22}
                      color={selected ? colors.green : colors.subtle}
                    />
                  )}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.canvas },
  content: { padding: 18, paddingBottom: 38 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(6, 20, 43, 0.55)",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 34,
  },
  handle: {
    width: 42,
    height: 4,
    alignSelf: "center",
    borderRadius: 99,
    backgroundColor: colors.line,
    marginBottom: 18,
  },
  sheetTitle: { fontSize: 21, fontWeight: "900", color: colors.ink },
  sheetBody: { color: colors.muted, marginTop: 5, marginBottom: 14 },
  roleOption: {
    minHeight: 68,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
  },
  roleOptionSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blueSoft,
  },
  roleOptionCopy: { flex: 1, paddingRight: 12 },
  roleOptionTitle: { fontSize: 13, fontWeight: "900", color: colors.ink },
  roleOptionBody: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 3,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    marginTop: 5,
    marginBottom: 18,
  },
  inviteCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: 16,
    gap: 10,
  },
  inviteHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 4,
  },
  inviteIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.navySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 15, fontWeight: "900", color: "#fff" },
  cardMeta: { fontSize: 10, color: "#8095B6", marginTop: 3 },
  label: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#AFC0DC",
    marginTop: 4,
  },
  inputWrap: {
    height: 49,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: colors.navySoft,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: { flex: 1, height: "100%", fontSize: 14, color: "#fff" },
  roles: { gap: 7 },
  role: {
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#29446C",
    justifyContent: "center",
  },
  roleActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  roleText: { fontSize: 9, fontWeight: "800", color: "#95A8C5" },
  roleTextActive: { color: "#fff" },
  listHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 27,
    marginBottom: 10,
  },
  section: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    color: colors.muted,
  },
  count: {
    minWidth: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  countText: { fontSize: 10, fontWeight: "900", color: colors.blue },
  member: {
    minHeight: 78,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    padding: 13,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: { fontSize: 14, fontWeight: "800", color: colors.ink },
  memberEmail: { fontSize: 11, color: colors.muted, marginTop: 2 },
  memberMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.subtle,
  },
  statusActive: { backgroundColor: colors.green },
  memberStatus: { fontSize: 8, fontWeight: "800", color: colors.subtle },
  owner: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFF7DD",
    flexDirection: "row",
    gap: 4,
  },
  ownerText: { fontSize: 8, fontWeight: "900", color: "#8A6411" },
  actions: { alignItems: "flex-end", gap: 7 },
  roleButton: {
    height: 29,
    paddingHorizontal: 8,
    borderRadius: 9,
    backgroundColor: colors.blueSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  currentRole: { fontSize: 8, fontWeight: "900", color: colors.blueDark },
  remove: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: colors.dangerSoft,
    alignItems: "center",
    justifyContent: "center",
  },
});
