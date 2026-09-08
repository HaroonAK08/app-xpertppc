import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { api } from "../api/client";
export async function registerPush(): Promise<void> {
  if (!Device.isDevice) return;
  const current = await Notifications.getPermissionsAsync();
  const permission =
    current.status === "granted"
      ? current
      : await Notifications.requestPermissionsAsync();
  if (permission.status !== "granted") return;
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (typeof projectId !== "string") return;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await api("/v1/devices/register", {
    method: "POST",
    body: JSON.stringify({
      platform: Device.osName === "iOS" ? "ios" : "android",
      pushToken: token,
    }),
  });
}
export function listenForPushNavigation(): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const leadId = response.notification.request.content.data?.leadId;
      if (typeof leadId === "string") router.push(`/lead/${leadId}`);
    },
  );
  return () => subscription.remove();
}
