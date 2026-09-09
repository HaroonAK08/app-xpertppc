import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { bindQueryLifecycle } from "../src/services/query/lifecycle";
import {
  listenForPushNavigation,
  registerPush,
} from "../src/services/push/register";
import { connectRealtime } from "../src/services/websocket/client";
import { useSessionStore } from "../src/store/session";
import { colors } from "../src/ui/theme";

void SplashScreen.preventAutoHideAsync().catch(() => undefined);
void SystemUI.setBackgroundColorAsync(colors.canvas);

export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 45_000,
            gcTime: 30 * 60_000,
            retry: (failureCount, error) =>
              failureCount < 2 &&
              !error.message.toLowerCase().includes("access"),
            retryDelay: (attempt) => Math.min(700 * 2 ** attempt, 5_000),
            refetchOnReconnect: true,
            refetchOnWindowFocus: true,
            networkMode: "offlineFirst",
          },
          mutations: { retry: 0 },
        },
      }),
  );
  const token = useSessionStore((state) => state.accessToken);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrate = useSessionStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
    const unbindQueries = bindQueryLifecycle();
    const unbindPush = listenForPushNavigation();
    return () => {
      unbindQueries();
      unbindPush();
    };
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  useEffect(
    () => (token ? connectRealtime(token, client) : undefined),
    [token, client],
  );
  useEffect(() => {
    if (token) void registerPush();
  }, [token]);

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: "#0B1220" }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <QueryClientProvider client={client}>
        <StatusBar style="dark" backgroundColor={colors.canvas} />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: 280,
            freezeOnBlur: true,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          <Stack.Screen name="index" options={{ animation: "none" }} />
          <Stack.Screen
            name="(auth)"
            options={{
              animation: "fade",
              contentStyle: { backgroundColor: colors.navy },
            }}
          />
          <Stack.Screen
            name="(onboarding)"
            options={{
              animation: "fade",
              contentStyle: { backgroundColor: colors.navy },
            }}
          />
          <Stack.Screen name="(tabs)" options={{ animation: "fade" }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
