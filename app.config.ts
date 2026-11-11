// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
// Bundle ID can only contain letters, numbers, and dots
// Android requires each dot-separated segment to start with a letter
const rawBundleId = "space.manus.eldercare.t263687757812581";
const bundleId =
  rawBundleId
    .replace(/[-_]/g, ".") // Replace hyphens/underscores with dots
    .replace(/[^a-zA-Z0-9.]/g, "") // Remove invalid chars
    .replace(/\.+/g, ".") // Collapse consecutive dots
    .replace(/^\.+|\.+$/g, "") // Trim leading/trailing dots
    .toLowerCase()
    .split(".")
    .map((segment) => {
      // Android requires each segment to start with a letter
      // Prefix with 'x' if segment starts with a digit
      return /^[a-zA-Z]/.test(segment) ? segment : "x" + segment;
    })
    .join(".") || "space.manus.app";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

function configuredFirebaseFile(envName: string, localPath: string): string | undefined {
  const configuredPath = process.env[envName]?.trim();
  const path = configuredPath
    ? (isAbsolute(configuredPath) ? configuredPath : resolve(process.cwd(), configuredPath))
    : resolve(process.cwd(), localPath);
  if (!existsSync(path)) {
    if (configuredPath) throw new Error(`${envName} points to a file that does not exist.`);
    return undefined;
  }
  return path;
}

const googleServicesFile = configuredFirebaseFile("GOOGLE_SERVICES_JSON_FILE", "firebase/google-services.json");
const googleServiceInfoPlistFile = configuredFirebaseFile("GOOGLE_SERVICE_INFO_PLIST_FILE", "firebase/GoogleService-Info.plist");
const firebaseNativePluginEnabled = Boolean(googleServicesFile || googleServiceInfoPlistFile);

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "ElderCare Companion",
  appSlug: "eldercare",
  // Durable project logo metadata; native launcher assets live under assets/images.
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663838475378/dhAkvdRKcoRjUNHS.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

// Expo serializes this browser-safe subset into native and web bundles. The server-only
// MANUS_API_KEY and MANUS_JWT_SECRET must never enter this object.
const publicRuntime = {
  oauthPortalUrl:
    process.env.MANUS_OAUTH_PORTAL_URL ??
    process.env.VITE_OAUTH_PORTAL_URL ??
    process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ??
    "",
  oauthServerUrl:
    process.env.MANUS_OAUTH_API_URL ??
    process.env.OAUTH_SERVER_URL ??
    process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ??
    "",
  appId:
    process.env.MANUS_PROJECT_ID ??
    process.env.VITE_APP_ID ??
    process.env.EXPO_PUBLIC_APP_ID ??
    "",
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    "https://eldercare-api-vaee.onrender.com",
  firebaseNativeConfigured: Boolean(googleServicesFile || googleServiceInfoPlistFile),
  firebaseAndroidConfigured: Boolean(googleServicesFile),
  firebaseIosConfigured: Boolean(googleServiceInfoPlistFile),
  ...(process.env.EAS_PROJECT_ID?.trim() ? { eas: { projectId: process.env.EAS_PROJECT_ID.trim() } } : {}),
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  extra: publicRuntime,
  orientation: "portrait",
  icon: "./assets/images/eldercare-icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    googleServicesFile: googleServiceInfoPlistFile,
    "infoPlist": {
        "ITSAppUsesNonExemptEncryption": false
      }
  },
  android: {
    googleServicesFile,
    adaptiveIcon: {
      backgroundColor: "#17324D",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-asset",
    "expo-router",
    ...(firebaseNativePluginEnabled ? ["@react-native-firebase/app", "@react-native-firebase/auth"] : []),
    "expo-notifications",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#F7F2EA",
        dark: {
          backgroundColor: "#17324D",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
