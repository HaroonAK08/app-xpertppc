import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps, ReactNode } from "react";
import { useEffect, useRef } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, radius, shadow, statusColor } from "./theme";
type IconName = ComponentProps<typeof Ionicons>["name"];
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={s.brand}>
      <View style={s.logo}>
        <View style={s.logoCore} />
      </View>
      {!compact && (
        <View style={s.brandWord}>
          <Text style={[s.brandText, s.brandBlue]}>XPERT</Text>
          <Text style={s.brandText}>PPC</Text>
        </View>
      )}
    </View>
  );
}
export function ScreenHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={s.header}>
      <View style={{ flex: 1 }}>
        {Boolean(eyebrow) && <Text style={s.eyebrow}>{eyebrow}</Text>}
        <Text style={s.title}>{title}</Text>
      </View>
      {action}
    </View>
  );
}
export function IconButton({
  name,
  onPress,
  label,
}: {
  name: IconName;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [s.iconButton, pressed && s.pressed]}
    >
      <Ionicons name={name} size={21} color={colors.ink} />
    </Pressable>
  );
}
export function StatusPill({ status }: { status: string }) {
  const tone = statusColor(status);
  return (
    <View style={[s.pill, { backgroundColor: tone.bg }]}>
      <View style={[s.pillDot, { backgroundColor: tone.fg }]} />
      <Text style={[s.pillText, { color: tone.fg }]}>{status}</Text>
    </View>
  );
}
export function Avatar({
  name,
  size = 42,
}: {
  name?: string | null;
  size?: number;
}) {
  const initials = (name ?? "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
  return (
    <View
      style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[s.avatarText, { fontSize: size * 0.34 }]}>{initials}</Text>
    </View>
  );
}
export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: IconName;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.blue} />
      </View>
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptyBody}>{body}</Text>
      {action}
    </View>
  );
}
export function Skeleton({
  width = "100%",
  height = 16,
}: {
  width?: number | `${number}%`;
  height?: number;
}) {
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    void AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) return;
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.85,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.45,
            duration: 700,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
    });
    return () => animation?.stop();
  }, [opacity]);
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[s.skeleton, { width, height, opacity }]}
    />
  );
}
export const ui = {
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    ...shadow,
  },
  page: { flex: 1, backgroundColor: colors.canvas },
} as const;
const s = StyleSheet.create({
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandWord: { flexDirection: "row", alignItems: "center" },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  logoCore: {
    width: 12,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.blue,
  },
  brandText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },
  brandBlue: { color: colors.blue },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: colors.blue,
    marginBottom: 5,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    letterSpacing: -0.8,
    color: colors.ink,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  avatar: {
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.blueDark, fontWeight: "900" },
  empty: { alignItems: "center", padding: 32, gap: 8 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.blueSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.muted,
    textAlign: "center",
  },
  skeleton: { backgroundColor: colors.line, borderRadius: 8 },
});
