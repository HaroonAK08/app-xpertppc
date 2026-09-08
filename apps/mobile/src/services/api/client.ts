import * as SecureStore from "expo-secure-store";
import { useSessionStore } from "../../store/session";
const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
let refreshPromise: Promise<string | null> | null = null;
const REQUEST_TIMEOUT_MS = 20_000;
async function refreshAccess(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) return null;
  try {
    const response = await fetch(`${baseUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) throw new Error("refresh failed");
    const tokens = (await response.json()) as {
      accessToken: string;
      refreshToken: string;
    };
    await useSessionStore.getState().setTokens(tokens);
    return tokens.accessToken;
  } catch {
    await useSessionStore.getState().clear();
    return null;
  }
}
export async function api<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  // The Zustand session is hydrated once at launch, avoiding a SecureStore bridge
  // round-trip on every request. Refresh tokens remain in encrypted storage.
  const token = useSessionStore.getState().accessToken;
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });
  } catch (error) {
    if (timedOut)
      throw new Error(
        "Request timed out. Check your connection and try again.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abort);
  }
  if (response.status === 401 && retry) {
    refreshPromise ??= refreshAccess().finally(() => {
      refreshPromise = null;
    });
    if (await refreshPromise) return api<T>(path, init, false);
  }
  const payload = (await response.json().catch(() => null)) as
    | T
    | { error: { message: string } }
    | null;
  if (!response.ok)
    throw new Error(
      payload && "error" in (payload as object)
        ? (payload as { error: { message: string } }).error.message
        : "Request failed",
    );
  return payload as T;
}
