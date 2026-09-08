export async function registerPush(): Promise<void> {
  // Native push providers are intentionally disabled in the browser build.
}

export function listenForPushNavigation(): () => void {
  return () => undefined;
}
