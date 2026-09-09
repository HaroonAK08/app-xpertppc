import { Redirect } from "expo-router";
import { View } from "react-native";
import { useSessionStore } from "../src/store/session";
import { colors } from "../src/ui/theme";

export default function Index() {
  const { accessToken, hydrated } = useSessionStore();
  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: "#0B1220" }} />;
  }
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Redirect href={accessToken ? "/(tabs)/home" : "/(auth)/login"} />
    </View>
  );
}
