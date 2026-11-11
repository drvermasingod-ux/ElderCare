import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { isSignupRole, type SignupRole, PHONE_AUTH_SMS_CONSENT_VERSION } from "../../shared/firebase-auth";
import { ENV } from "./env";

const ADMIN_APP_NAME = "eldercare-admin";

export type FirebaseIdentityClaims = Pick<DecodedIdToken, "uid" | "email" | "email_verified" | "phone_number" | "firebase">;
export type FirebaseAuthProvider = "phone" | "password";
export type FirebaseRole = SignupRole;

export type FirebaseProfile = {
  uid: string;
  role: FirebaseRole;
  status: "active";
  displayName: string;
  email: string | null;
  authProvider: FirebaseAuthProvider;
  createdAt: Date;
  updatedAt: Date;
};

export type FirebaseAppUser = {
  id: string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string;
  role: FirebaseRole;
  lastSignedIn: string;
  authProvider: "firebase";
};

export class FirebaseAdminNotConfiguredError extends Error {
  constructor() {
    super("Firebase server authentication is not configured.");
    this.name = "FirebaseAdminNotConfiguredError";
  }
}

export class FirebaseAccountDisabledError extends Error {
  constructor() {
    super("This ElderCare account is not active.");
    this.name = "FirebaseAccountDisabledError";
  }
}

export class FirebaseProfileConflictError extends Error {
  constructor() {
    super("The account profile could not be created. Contact support.");
    this.name = "FirebaseProfileConflictError";
  }
}

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(ENV.firebaseProjectId.trim() && ENV.firebaseClientEmail.trim() && ENV.firebasePrivateKey.trim());
}

function getAdminApp(): App {
  if (!isFirebaseAdminConfigured()) throw new FirebaseAdminNotConfiguredError();
  const existing = getApps().find((app) => app.name === ADMIN_APP_NAME);
  if (existing) return existing;
  const privateKey = ENV.firebasePrivateKey.replace(/\\n/g, "\n");
  return initializeApp(
    {
      projectId: ENV.firebaseProjectId,
      credential: cert({
        projectId: ENV.firebaseProjectId,
        clientEmail: ENV.firebaseClientEmail,
        privateKey,
      }),
    },
    ADMIN_APP_NAME,
  );
}

export function getFirebaseIdentityEligibility(claims: FirebaseIdentityClaims): { allowed: boolean; reason?: "email-unverified" | "phone-unverified" | "unsupported-provider" } {
  const provider = claims.firebase?.sign_in_provider;
  if (provider === "phone") {
    return claims.phone_number ? { allowed: true } : { allowed: false, reason: "phone-unverified" };
  }
  if (provider === "password") {
    return claims.email_verified === true ? { allowed: true } : { allowed: false, reason: "email-unverified" };
  }
  return { allowed: false, reason: "unsupported-provider" };
}

export function isFirebaseSignupRole(value: unknown): value is FirebaseRole {
  return isSignupRole(value);
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  const app = getAdminApp();
  return getAuth(app).verifyIdToken(idToken, true);
}

function asDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number" || typeof value === "string") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date(0);
}

function profileFromData(uid: string, data: FirebaseFirestore.DocumentData | undefined): FirebaseProfile | null {
  if (!data) return null;
  if (!isSignupRole(data.role) || data.status !== "active") throw new FirebaseAccountDisabledError();
  if (typeof data.displayName !== "string" || !["phone", "password"].includes(data.authProvider)) {
    throw new FirebaseAccountDisabledError();
  }
  return {
    uid,
    role: data.role,
    status: "active",
    displayName: data.displayName,
    email: typeof data.email === "string" ? data.email : null,
    authProvider: data.authProvider,
    createdAt: asDate(data.createdAt),
    updatedAt: asDate(data.updatedAt),
  };
}

export async function getFirebaseProfile(uid: string): Promise<FirebaseProfile | null> {
  const app = getAdminApp();
  const snapshot = await getFirestore(app).collection("users").doc(uid).get();
  if (!snapshot.exists) return null;
  return profileFromData(uid, snapshot.data());
}

export async function createOrGetFirebaseProfile(input: {
  claims: DecodedIdToken;
  role: FirebaseRole;
  displayName: string;
  smsConsent?: boolean;
  smsConsentVersion?: string;
}): Promise<{ profile: FirebaseProfile; created: boolean }> {
  if (!isSignupRole(input.role)) throw new FirebaseProfileConflictError();
  const eligibility = getFirebaseIdentityEligibility(input.claims);
  if (!eligibility.allowed) throw new FirebaseProfileConflictError();
  const provider = input.claims.firebase?.sign_in_provider as FirebaseAuthProvider;
  if (provider === "phone" && (!input.smsConsent || input.smsConsentVersion !== PHONE_AUTH_SMS_CONSENT_VERSION)) {
    throw new FirebaseProfileConflictError();
  }

  const app = getAdminApp();
  const firestore = getFirestore(app);
  const userRef = firestore.collection("users").doc(input.claims.uid);
  let created = false;
  await firestore.runTransaction(async (transaction) => {
    created = false;
    const existing = await transaction.get(userRef);
    if (existing.exists) {
      profileFromData(input.claims.uid, existing.data());
      return;
    }
    const now = FieldValue.serverTimestamp();
    const profile: Record<string, unknown> = {
      uid: input.claims.uid,
      role: input.role,
      status: "active",
      displayName: input.displayName,
      email: typeof input.claims.email === "string" ? input.claims.email : null,
      authProvider: provider,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
    };
    if (provider === "phone") {
      profile.phoneAuthSmsConsentVersion = PHONE_AUTH_SMS_CONSENT_VERSION;
      profile.phoneAuthSmsConsentAt = now;
    }
    transaction.create(userRef, profile);
    created = true;
  });

  const profile = await getFirebaseProfile(input.claims.uid);
  if (!profile) throw new FirebaseProfileConflictError();
  return { profile, created };
}

export function toFirebaseAppUser(profile: FirebaseProfile): FirebaseAppUser {
  return {
    id: `firebase:${profile.uid}`,
    openId: profile.uid,
    name: profile.displayName,
    email: profile.email,
    loginMethod: profile.authProvider,
    role: profile.role,
    lastSignedIn: profile.updatedAt.toISOString(),
    authProvider: "firebase",
  };
}

export async function authenticateFirebaseBearer(idToken: string): Promise<FirebaseAppUser | null> {
  const claims = await verifyFirebaseIdToken(idToken);
  if (!getFirebaseIdentityEligibility(claims).allowed) return null;
  const profile = await getFirebaseProfile(claims.uid);
  return profile ? toFirebaseAppUser(profile) : null;
}
