import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./auth";
import * as FirebaseAuth from "@/lib/firebase-auth";
import { isFirebaseAuthBackendReady, type FirebaseIntegrationStatus, type SignupRole } from "@/shared/firebase-auth";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

export type FirebaseApiUser = {
  id: number | string;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string;
  role: "parent" | "child";
  lastSignedIn: string;
  authProvider: "firebase";
};

export type FirebaseSessionResponse = {
  user: FirebaseApiUser | null;
  needsProfile?: boolean;
  needsEmailVerification?: boolean;
  email?: string | null;
  error?: string;
};

type ServerErrorBody = { error?: string; message?: string; code?: string };

export async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");

  // The mobile care API accepts only the refreshed Firebase ID token. No legacy token
  // is stored or attached, and native requests do not forward browser cookies.
  const idToken = await FirebaseAuth.getIdToken();
  if (idToken) headers.set("Authorization", `Bearer ${idToken}`);

  const baseUrl = getApiBaseUrl();
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = baseUrl ? `${cleanBaseUrl}${cleanEndpoint}` : endpoint;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "omit",
    });
  } catch {
    throw new Error("Could not reach ElderCare services. Check your connection and try again.");
  }

  if (!response.ok) {
    const text = await response.text();
    let body: ServerErrorBody = {};
    try {
      body = JSON.parse(text) as ServerErrorBody;
    } catch {
      // Do not expose raw upstream HTML or proxy details in the app.
    }
    throw new ApiError(
      body.error || body.message || `ElderCare service request failed (${response.status}).`,
      response.status,
      body.code,
    );
  }

  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return (await response.json()) as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : {}) as T;
}

export async function logout(): Promise<void> {
  await FirebaseAuth.signOut();
  await Auth.clearUserInfo();
}

export async function getMe(): Promise<FirebaseSessionResponse> {
  try {
    return await apiCall<FirebaseSessionResponse>("/api/auth/firebase/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const token = await FirebaseAuth.getIdToken().catch(() => null);
      if (token) {
        return {
          user: null,
          needsProfile: false,
          needsEmailVerification: false,
          error: "The ElderCare API rejected this Firebase session. Sign in again or contact support.",
        };
      }
      return { user: null, needsProfile: false, needsEmailVerification: false };
    }
    return {
      user: null,
      needsProfile: false,
      needsEmailVerification: false,
      error: error instanceof Error ? error.message : "Could not verify this account with ElderCare services.",
    };
  }
}

export async function getFirebaseAuthBackendReady(): Promise<boolean> {
  const result = await apiCall<{ integrations?: FirebaseIntegrationStatus[] }>("/api/integrations/status");
  return isFirebaseAuthBackendReady(result.integrations);
}

export async function bootstrapFirebaseProfile(input: {
  role: SignupRole;
  displayName: string;
  smsConsent?: boolean;
  smsConsentVersion?: string;
}): Promise<{ user: FirebaseApiUser; created: boolean }> {
  return apiCall("/api/auth/firebase/bootstrap", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
