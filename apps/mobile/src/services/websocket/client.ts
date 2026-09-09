import { QueryClient } from "@tanstack/react-query";
import { io, type Socket } from "socket.io-client";
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://xpertppc.com";
const events = [
  "lead.created",
  "lead.updated",
  "lead.assigned",
  "message.created",
  "message.updated",
  "notification.created",
] as const;
export function connectRealtime(
  accessToken: string,
  queryClient: QueryClient,
): () => void {
  const socket: Socket = io(`${baseUrl}/realtime`, {
    auth: { token: accessToken },
    transports: ["websocket"],
    reconnection: true,
  });
  const pending = new Set<"leads" | "conversations" | "notifications">();
  let flushTimer: ReturnType<typeof setTimeout> | undefined;
  const schedule = (key: "leads" | "conversations" | "notifications") => {
    pending.add(key);
    if (flushTimer) return;
    // Coalesce webhook bursts into a single cache update and render pass.
    flushTimer = setTimeout(() => {
      for (const queryKey of pending)
        void queryClient.invalidateQueries({ queryKey: [queryKey] });
      pending.clear();
      flushTimer = undefined;
    }, 120);
  };
  for (const event of events)
    socket.on(event, () => {
      if (event.startsWith("lead.")) schedule("leads");
      if (event.startsWith("message.")) schedule("conversations");
      if (event === "notification.created") schedule("notifications");
    });
  socket.on("connect", () => {
    void queryClient.refetchQueries({ type: "active" });
  });
  return () => {
    if (flushTimer) clearTimeout(flushTimer);
    socket.disconnect();
  };
}
