import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
type Tokens = { accessToken: string; refreshToken: string };
type Session = {
  accessToken: string | null;
  hydrated: boolean;
  hydrate(): Promise<void>;
  setTokens(tokens: Tokens): Promise<void>;
  clear(): Promise<void>;
};
export const useSessionStore = create<Session>((set) => ({
  accessToken: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const accessToken = await SecureStore.getItemAsync("accessToken");
      set({ accessToken, hydrated: true });
    } catch {
      set({ accessToken: null, hydrated: true });
    }
  },
  setTokens: async (tokens) => {
    await Promise.all([
      SecureStore.setItemAsync("accessToken", tokens.accessToken),
      SecureStore.setItemAsync("refreshToken", tokens.refreshToken),
    ]);
    set({ accessToken: tokens.accessToken });
  },
  clear: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync("accessToken"),
      SecureStore.deleteItemAsync("refreshToken"),
    ]);
    set({ accessToken: null, hydrated: true });
  },
}));
