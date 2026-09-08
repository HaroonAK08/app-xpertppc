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
export default function RootLayout() {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 10 * 60_000,
            retry: 2,
            refetchOnReconnect: true,
          },
          mutations: { retry: 0 },
        },
      }),
  );
  const token = useSessionStore((state) => state.accessToken);
  const hydrate = useSessionStore((state) => state.hydrate);
  useEffect(() => {
    void hydrate();
    return listenForPushNavigation();
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
