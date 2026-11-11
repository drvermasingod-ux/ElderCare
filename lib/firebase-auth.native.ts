import Constants from "expo-constants";
import type { Auth, ConfirmationResult, User } from "@react-native-firebase/auth";
import { Platform } from "react-native";
import type { FirebaseIdentity, PhoneChallenge } from "./firebase-auth.types";

const EXTRA = Constants.expoConfig?.extra as { firebaseAndroidConfigured?: boolean; firebaseIosConfigured?: boolean } | undefined;

function isConfigured() {
  if (Platform.OS === "android") return EXTRA?.firebaseAndroidConfigured === true;
  if (Platform.OS === "ios") return EXTRA?.firebaseIosConfigured === true;
  return false;
}

function unavailable(): Error {
  const platformName = Platform.OS === "ios" ? "iOS" : "Android";
  const configFile = Platform.OS === "ios" ? "GoogleService-Info.plist" : "google-services.json";
  return new Error(`Firebase app configuration is missing for ${platformName}. Add ${configFile} in EAS and create a new native build.`);
}

type AuthModule = typeof import("@react-native-firebase/auth");
function authModule(): AuthModule {
  if (!isConfigured()) throw unavailable();
  // Load only after the config plugin has been included in a custom native build.
  return require("@react-native-firebase/auth") as AuthModule;
}

function getAuthInstance(): Auth {
  return authModule().getAuth();
}

function toIdentity(user: User | null | undefined): FirebaseIdentity | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email ?? null,
    phoneNumber: user.phoneNumber ?? null,
    displayName: user.displayName ?? null,
    emailVerified: user.emailVerified,
  };
}

export function isNativeAuthConfigured(): boolean {
  return isConfigured();
}

export async function getCurrentUser(): Promise<FirebaseIdentity | null> {
  if (!isConfigured()) return null;
  return toIdentity(getAuthInstance().currentUser);
}

export function onAuthStateChanged(listener: (user: FirebaseIdentity | null) => void): () => void {
  if (!isConfigured()) return () => undefined;
  try {
    const { onAuthStateChanged: observe } = authModule();
    return observe(getAuthInstance(), (user) => listener(toIdentity(user)));
  } catch {
    return () => undefined;
  }
}

export async function getIdToken(forceRefresh = false): Promise<string | null> {
  if (!isConfigured()) return null;
  const user = getAuthInstance().currentUser;
  return user ? user.getIdToken(forceRefresh) : null;
}

export async function sendPhoneCode(phoneNumber: string): Promise<PhoneChallenge> {
  const { signInWithPhoneNumber } = authModule();
  const challenge: ConfirmationResult = await signInWithPhoneNumber(getAuthInstance(), phoneNumber);
  return {
    confirm: async (code: string) => {
      const result = await challenge.confirm(code);
      const identity = toIdentity(result.user);
      if (!identity) throw new Error("Phone verification did not return a signed-in account.");
      return identity;
    },
  };
}

export async function signInWithEmail(email: string, password: string): Promise<FirebaseIdentity> {
  const { signInWithEmailAndPassword } = authModule();
  const result = await signInWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  const identity = toIdentity(result.user);
  if (!identity) throw new Error("Email sign-in did not return an account.");
  return identity;
}

export async function createEmailAccount(email: string, password: string): Promise<FirebaseIdentity> {
  const { createUserWithEmailAndPassword, sendEmailVerification } = authModule();
  const result = await createUserWithEmailAndPassword(getAuthInstance(), email.trim(), password);
  await sendEmailVerification(result.user);
  const identity = toIdentity(result.user);
  if (!identity) throw new Error("Account creation did not return an account.");
  return identity;
}

export async function resendEmailVerification(): Promise<void> {
  const user = getAuthInstance().currentUser;
  if (!user) throw new Error("Sign in again to request an email verification link.");
  const { sendEmailVerification } = authModule();
  await sendEmailVerification(user);
}

export async function refreshCurrentUser(): Promise<FirebaseIdentity | null> {
  const user = getAuthInstance().currentUser;
  if (!user) return null;
  const { reload } = authModule();
  await reload(user);
  const refreshedUser = getAuthInstance().currentUser;
  if (!refreshedUser) return null;
  await refreshedUser.getIdToken(true);
  return toIdentity(refreshedUser);
}

export async function sendPasswordReset(email: string): Promise<void> {
  const { sendPasswordResetEmail } = authModule();
  await sendPasswordResetEmail(getAuthInstance(), email.trim());
}

export async function signOut(): Promise<void> {
  if (!isConfigured()) return;
  const { signOut: firebaseSignOut } = authModule();
  await firebaseSignOut(getAuthInstance());
}
