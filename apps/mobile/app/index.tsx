import { Redirect } from "expo-router";
import { useSessionStore } from "../src/store/session";
export default function Index() {
  const { accessToken, hydrated } = useSessionStore();
  if (!hydrated) return null;
  return <Redirect href={accessToken ? "/(tabs)/home" : "/(auth)/login"} />;
}
