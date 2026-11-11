import type { Express, Request, Response } from "express";
import { PHONE_AUTH_SMS_CONSENT_VERSION, isSignupRole } from "../../shared/firebase-auth";
import {
  FirebaseAccountDisabledError,
  FirebaseAdminNotConfiguredError,
  FirebaseProfileConflictError,
  createOrGetFirebaseProfile,
  getFirebaseIdentityEligibility,
  getFirebaseProfile,
  toFirebaseAppUser,
  verifyFirebaseIdToken,
} from "./firebase";

function bearerToken(req: Request): string | null {
  const value = req.header("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9._~-]+)$/i.exec(value.trim());
  return match?.[1] ?? null;
}

function sendFirebaseError(res: Response, error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  if (error instanceof FirebaseAdminNotConfiguredError) {
    res.status(503).json({ code: "FIREBASE_SERVER_NOT_CONFIGURED", error: "Firebase sign-in is not configured on the server." });
    return;
  }
  if (error instanceof FirebaseAccountDisabledError) {
    res.status(403).json({ code: "ACCOUNT_UNAVAILABLE", error: "This ElderCare account is unavailable. Contact support." });
    return;
  }
  if (error instanceof FirebaseProfileConflictError) {
    res.status(400).json({ code: "PROFILE_SETUP_FAILED", error: "Profile setup could not be completed. Check the account and try again." });
    return;
  }
  if (code === "auth/user-disabled") {
    res.status(403).json({ code: "ACCOUNT_UNAVAILABLE", error: "This Firebase account is disabled. Contact support." });
    return;
  }
  if (["auth/argument-error", "auth/invalid-id-token", "auth/id-token-expired", "auth/id-token-revoked"].includes(code)) {
    res.status(401).json({ code: "INVALID_FIREBASE_TOKEN", error: "Your Firebase session could not be verified. Sign in again." });
    return;
  }
  res.status(503).json({ code: "FIREBASE_SERVICE_UNAVAILABLE", error: "Firebase verification is temporarily unavailable. Try again later." });
}

export function registerFirebaseAuthRoutes(app: Express) {
  app.get("/api/auth/firebase/me", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to continue." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      const eligibility = getFirebaseIdentityEligibility(claims);
      if (eligibility.reason === "email-unverified") {
        res.json({ user: null, needsProfile: false, needsEmailVerification: true, email: claims.email ?? null });
        return;
      }
      if (!eligibility.allowed) {
        res.status(403).json({ code: "UNSUPPORTED_SIGN_IN_METHOD", error: "Use Phone OTP or Email/Password for this account." });
        return;
      }
      const profile = await getFirebaseProfile(claims.uid);
      if (!profile) {
        res.json({ user: null, needsProfile: true, needsEmailVerification: false, email: claims.email ?? null });
        return;
      }
      res.json({ user: toFirebaseAppUser(profile), needsProfile: false, needsEmailVerification: false });
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });

  app.post("/api/auth/firebase/bootstrap", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to continue." });
      return;
    }
    const role = req.body?.role;
    const displayName = typeof req.body?.displayName === "string" ? req.body.displayName.trim() : "";
    const smsConsent = req.body?.smsConsent === true;
    const smsConsentVersion = typeof req.body?.smsConsentVersion === "string" ? req.body.smsConsentVersion : undefined;

    if (!isSignupRole(role)) {
      res.status(400).json({ code: "ROLE_NOT_ALLOWED", error: "Choose Parent or Child/Family Member." });
      return;
    }
    if (displayName.length < 2 || displayName.length > 80 || /[<>\u0000-\u001f\u007f]/.test(displayName)) {
      res.status(400).json({ code: "INVALID_DISPLAY_NAME", error: "Enter a name between 2 and 80 characters." });
      return;
    }
    if (smsConsent && smsConsentVersion !== PHONE_AUTH_SMS_CONSENT_VERSION) {
      res.status(400).json({ code: "INVALID_SMS_CONSENT", error: "Please review the current SMS consent text." });
      return;
    }

    try {
      const claims = await verifyFirebaseIdToken(token);
      const eligibility = getFirebaseIdentityEligibility(claims);
      if (!eligibility.allowed) {
        if (eligibility.reason === "email-unverified") {
          res.status(403).json({ code: "EMAIL_VERIFICATION_REQUIRED", error: "Verify your email before completing account setup." });
          return;
        }
        res.status(403).json({ code: "UNSUPPORTED_SIGN_IN_METHOD", error: "Use Phone OTP or Email/Password for this account." });
        return;
      }
      if (claims.firebase?.sign_in_provider === "phone" && (!smsConsent || smsConsentVersion !== PHONE_AUTH_SMS_CONSENT_VERSION)) {
        res.status(400).json({ code: "SMS_CONSENT_REQUIRED", error: "Consent to receive the sign-in SMS before creating a phone account." });
        return;
      }
      const result = await createOrGetFirebaseProfile({ claims, role, displayName, smsConsent, smsConsentVersion });
      res.status(result.created ? 201 : 200).json({ user: toFirebaseAppUser(result.profile), created: result.created });
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });
}
