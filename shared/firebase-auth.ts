export const SIGNUP_ROLES = ["parent", "child"] as const;
export type SignupRole = (typeof SIGNUP_ROLES)[number];

export function isSignupRole(value: unknown): value is SignupRole {
  return value === "parent" || value === "child";
}

export const PHONE_AUTH_SMS_CONSENT_VERSION = "2026-11-10";

export type FirebaseIntegrationStatus = {
  provider?: string;
  configured?: boolean;
  implementation?: string;
};

export function isFirebaseAuthBackendReady(statuses: readonly FirebaseIntegrationStatus[] | undefined): boolean {
  const firebase = statuses?.find((item) => item.provider === "Firebase Auth / Firestore / FCM");
  return firebase?.configured === true && firebase.implementation === "adapter-only";
}
