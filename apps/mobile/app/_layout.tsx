import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { useSessionStore } from "../src/store/session";
import { connectRealtime } from "../src/services/websocket/client";
import {
  listenForPushNavigation,
  registerPush,
} from "../src/services/push/register";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/ui/theme";
import { bindQueryLifecycle } from "../src/services/query/lifecycle";
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
  useEffect(
    () => (token ? connectRealtime(token, client) : undefined),
    [token, client],
  );
  useEffect(() => {
    if (token) void registerPush();
  }, [token]);
  return (
    <QueryClientProvider client={client}>
      <StatusBar style="light" backgroundColor={colors.navy} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: colors.canvas },
        }}
      />
    </QueryClientProvider>
  );
}
