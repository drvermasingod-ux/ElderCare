import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { USER_INFO_KEY } from "@/constants/oauth";

export type User = {
  id: number | string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role?: string | null;
  lastSignedIn: Date;
  authProvider?: "firebase" | "legacy";
};

/** Cached display data only; every role and protected session is reloaded from the API. */
export async function getUserInfo(): Promise<User | null> {
  try {
    const info = Platform.OS === "web"
      ? window.localStorage.getItem(USER_INFO_KEY)
      : await SecureStore.getItemAsync(USER_INFO_KEY);
    return info ? JSON.parse(info) as User : null;
  } catch {
    return null;
  }
}

export async function setUserInfo(user: User): Promise<void> {
  try {
    const serialized = JSON.stringify(user);
    if (Platform.OS === "web") window.localStorage.setItem(USER_INFO_KEY, serialized);
    else await SecureStore.setItemAsync(USER_INFO_KEY, serialized);
  } catch {
    // The cache is optional and never grants access.
  }
}

export async function clearUserInfo(): Promise<void> {
  try {
    if (Platform.OS === "web") window.localStorage.removeItem(USER_INFO_KEY);
    else await SecureStore.deleteItemAsync(USER_INFO_KEY);
  } catch {
    // Session authorization remains server-side even if cache cleanup fails.
  }
}
