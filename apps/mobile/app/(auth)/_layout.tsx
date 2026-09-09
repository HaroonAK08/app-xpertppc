import { Stack } from "expo-router";
import { colors } from "../../src/ui/theme";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 260,
        freezeOnBlur: true,
        contentStyle: { backgroundColor: colors.navy },
      }}
    />
  );
}
