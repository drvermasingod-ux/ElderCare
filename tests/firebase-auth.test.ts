import { describe, expect, it } from "vitest";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getFirebaseIdentityEligibility, isFirebaseSignupRole } from "../server/_core/firebase";
import { isFirebaseAuthBackendReady } from "../shared/firebase-auth";

function claims(provider: string, overrides: Partial<DecodedIdToken> = {}): DecodedIdToken {
  return {
    uid: "firebase-test-user",
    firebase: { sign_in_provider: provider, identities: {} },
    ...overrides,
  } as DecodedIdToken;
}

describe("Firebase identity eligibility", () => {
  it("allows verified Phone OTP identities", () => {
    expect(getFirebaseIdentityEligibility(claims("phone", { phone_number: "+15555550123" }))).toEqual({ allowed: true });
  });

  it("rejects a phone identity without a verified phone claim", () => {
    expect(getFirebaseIdentityEligibility(claims("phone"))).toEqual({ allowed: false, reason: "phone-unverified" });
  });

  it("allows only Email/Password identities with verified email", () => {
    expect(getFirebaseIdentityEligibility(claims("password", { email: "parent@example.com", email_verified: true }))).toEqual({ allowed: true });
    expect(getFirebaseIdentityEligibility(claims("password", { email: "parent@example.com", email_verified: false }))).toEqual({ allowed: false, reason: "email-unverified" });
  });

  it("rejects unsupported providers", () => {
    expect(getFirebaseIdentityEligibility(claims("anonymous"))).toEqual({ allowed: false, reason: "unsupported-provider" });
    expect(getFirebaseIdentityEligibility(claims("google.com"))).toEqual({ allowed: false, reason: "unsupported-provider" });
  });

  it("permits only Parent and Child self-signup roles", () => {
    expect(isFirebaseSignupRole("parent")).toBe(true);
    expect(isFirebaseSignupRole("child")).toBe(true);
    expect(isFirebaseSignupRole("admin")).toBe(false);
    expect(isFirebaseSignupRole("staff")).toBe(false);
    expect(isFirebaseSignupRole("user")).toBe(false);
  });

  it("does not enable the client when the Firebase adapter or server credentials are missing", () => {
    expect(isFirebaseAuthBackendReady(undefined)).toBe(false);
    expect(isFirebaseAuthBackendReady([{ provider: "Firebase Auth / Firestore / FCM", configured: true, implementation: "not-implemented" }])).toBe(false);
    expect(isFirebaseAuthBackendReady([{ provider: "Firebase Auth / Firestore / FCM", configured: false, implementation: "adapter-only" }])).toBe(false);
    expect(isFirebaseAuthBackendReady([{ provider: "Firebase Auth / Firestore / FCM", configured: true, implementation: "adapter-only" }])).toBe(true);
  });
});
