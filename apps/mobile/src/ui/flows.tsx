import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BrandMark } from "./components";
import { colors, radius } from "./theme";
type IconName = ComponentProps<typeof Ionicons>["name"];
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  icon = "arrow-forward",
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: IconName;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        s.primary,
        pressed && s.pressed,
        (disabled || loading) && s.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          <Text style={s.primaryText}>{label}</Text>
          <Ionicons name={icon} size={18} color="#fff" />
        </>
      )}
    </Pressable>
  );
}
export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const palette =
    tone === "success"
      ? {
          bg: colors.greenSoft,
          fg: "#078451",
          icon: "checkmark-circle" as IconName,
        }
      : tone === "info"
        ? {
            bg: colors.blueSoft,
            fg: colors.blueDark,
            icon: "information-circle" as IconName,
          }
        : {
            bg: colors.dangerSoft,
            fg: colors.danger,
            icon: "alert-circle" as IconName,
          };
  return (
    <View style={[s.notice, { backgroundColor: palette.bg }]}>
      <Ionicons name={palette.icon} size={18} color={palette.fg} />
      <Text style={[s.noticeText, { color: palette.fg }]}>{children}</Text>
    </View>
  );
}
export function ProgressDots({
  step,
  total = 3,
}: {
  step: number;
  total?: number;
}) {
  return (
    <View accessibilityLabel={`Step ${step} of ${total}`} style={s.progress}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[s.progressTrack, i + 1 <= step && s.progressActive]}
        />
      ))}
    </View>
  );
}
export function OnboardingShell({
  step,
  title,
  body,
  children,
}: {
  step: number;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={s.page}>
      <View style={s.top}>
        <BrandMark />
        <Text style={s.skip}>SETUP</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
      >
        <ProgressDots step={step} />
        <Text style={s.eyebrow}>STEP {step} OF 3</Text>
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{body}</Text>
        <View style={s.children}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
export function SelectionCard({
  icon,
  title,
  subtitle,
  selected = false,
  disabled = false,
  onPress,
  right,
}: {
  icon: IconName;
  title: string;
  subtitle: string;
  selected?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.selection,
        selected && s.selectionActive,
        pressed && s.pressed,
        disabled && s.disabled,
      ]}
    >
      <View style={[s.selectionIcon, selected && s.selectionIconActive]}>
        <Ionicons
          name={icon}
          size={21}
          color={selected ? "#fff" : colors.blue}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.selectionTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={s.selectionSub}>
          {subtitle}
        </Text>
      </View>
      {right ?? (
        <Ionicons
          name={selected ? "checkmark-circle" : "chevron-forward"}
          size={21}
          color={selected ? colors.green : colors.subtle}
        />
      )}
    </Pressable>
  );
}
const s = StyleSheet.create({
  primary: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  primaryText: { color: "#fff", fontSize: 15, fontWeight: "900" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.48 },
  notice: {
    borderRadius: radius.md,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 18, fontWeight: "600" },
  progress: { height: 5, flexDirection: "row", gap: 6, marginBottom: 22 },
  progressTrack: { flex: 1, borderRadius: 3, backgroundColor: "#243B61" },
  progressActive: { backgroundColor: colors.blue },
  page: { flex: 1, backgroundColor: colors.navy },
  top: {
    height: 70,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skip: {
    color: "#7185A5",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  content: { flexGrow: 1, padding: 22, paddingTop: 20, paddingBottom: 36 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: colors.green,
    marginBottom: 9,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "900",
    letterSpacing: -1,
    color: "#fff",
  },
  body: { fontSize: 14, lineHeight: 22, color: "#AFC0DC", marginTop: 10 },
  children: { marginTop: 27, gap: 11 },
  selection: {
    minHeight: 72,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#29446C",
    backgroundColor: colors.navySoft,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectionActive: { borderColor: colors.blue, backgroundColor: "#122E59" },
  selectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#18355E",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionIconActive: { backgroundColor: colors.blue },
  selectionTitle: { color: "#fff", fontSize: 14, fontWeight: "800" },
  selectionSub: { color: "#8196B7", fontSize: 11, marginTop: 4 },
});
