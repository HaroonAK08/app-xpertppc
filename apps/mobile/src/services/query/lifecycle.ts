import { focusManager, onlineManager } from "@tanstack/react-query";
import { AppState, Platform, type AppStateStatus } from "react-native";

export function bindQueryLifecycle(): () => void {
  const onAppState = (status: AppStateStatus) => {
    if (Platform.OS !== "web") focusManager.setFocused(status === "active");
  };
  const appState = AppState.addEventListener("change", onAppState);

  if (Platform.OS !== "web" || typeof window === "undefined") {
    return () => appState.remove();
  }

  const updateOnline = () => onlineManager.setOnline(navigator.onLine);
  window.addEventListener("online", updateOnline);
  window.addEventListener("offline", updateOnline);
  updateOnline();
  return () => {
    appState.remove();
    window.removeEventListener("online", updateOnline);
    window.removeEventListener("offline", updateOnline);
  };
}
