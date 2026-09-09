module.exports = {
  name: "XpertPPC CRM",
  slug: "xpertppc-crm",
  scheme: "app",
  version: "0.1.1",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/icon.png",
  splash: {
    image: "./assets/splash-logo.png",
    resizeMode: "contain",
    backgroundColor: "#0B1220",
  },
  android: {
    package: "com.xpertppc.crm",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0B1220",
    },
  },
  ios: {
    bundleIdentifier: "com.xpertppc.crm",
    supportsTablet: true,
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#0B1220",
        image: "./assets/splash-logo.png",
        imageWidth: 200,
      },
    ],
    [
      "expo-notifications",
      {
        color: "#2563EB",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://xpertppc.com",
  },
};
