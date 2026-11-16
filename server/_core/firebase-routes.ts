import type { Express, Request, Response } from "express";
import { PHONE_AUTH_SMS_CONSENT_VERSION, isSignupRole } from "../../shared/firebase-auth";
import { FAMILY_LINK_CONSENT_VERSION, isE164Phone, isFamilyInviteCode } from "../../shared/firebase-family";
import { LOCATION_SHARING_CONSENT_VERSION, isValidLocationUpload } from "../../shared/location";
import { acceptFamilyInvite, createFamilyInvite, FamilyLinkRequestError, listFamilyRelationships } from "./firebase-family";
import { getLocationSharingState, getSharedFamilyLocations, LocationServiceError, setLocationSharing, updateOwnLocation } from "./firebase-location";
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
  if (error instanceof LocationServiceError) {
    if (error.code === "RATE_LIMITED") {
      res.status(429).json({ code: error.code, error: "Location updates are arriving too quickly. Please wait before trying again." });
    } else if (error.code === "SHARING_DISABLED") {
      res.status(403).json({ code: error.code, error: "Turn on location sharing with your explicit consent before sending location." });
    } else if (error.code === "CONSENT_REQUIRED") {
      res.status(400).json({ code: error.code, error: "Review and accept the current location-sharing consent before continuing." });
    } else if (error.code === "LOCATION_INVALID") {
      res.status(400).json({ code: error.code, error: "The device returned an invalid location or accuracy value." });
    } else if (error.code === "TOO_MANY_LINKS") {
      res.status(409).json({ code: error.code, error: "Location sharing is unavailable because this account has too many active family links. Contact support." });
    } else {
      res.status(403).json({ code: error.code, error: "An active ElderCare account is required for location sharing." });
    }
    return;
  }
  if (error instanceof FamilyLinkRequestError) {
    if (error.code === "PHONE_VERIFICATION_REQUIRED") {
      res.status(403).json({ code: error.code, error: "Verify and attach your mobile number to this Firebase account before family linking." });
    } else if (error.code === "ACCOUNT_NOT_READY") {
      res.status(403).json({ code: error.code, error: "Complete secure account setup before family linking." });
    } else if (error.code === "RATE_LIMITED") {
      res.status(429).json({ code: error.code, error: "Too many family-link attempts. Please wait and try again." });
    } else if (error.code === "CONSENT_REQUIRED") {
      res.status(400).json({ code: error.code, error: "Review and accept the family-link consent before continuing." });
    } else {
      res.status(400).json({ code: "INVITE_INVALID", error: "This invitation is invalid, expired, already used, or does not match this verified account." });
    }
    return;
  }
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

  app.get("/api/family/links", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to view family links." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      if (!getFirebaseIdentityEligibility(claims).allowed || !(await getFirebaseProfile(claims.uid))) {
        res.status(403).json({ code: "FAMILY_LINK_ACCOUNT_REQUIRED", error: "A verified, active Parent or Child account is required." });
        return;
      }
      res.json({ links: await listFamilyRelationships(claims.uid) });
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });

  app.post("/api/family/invites", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to create an invitation." });
      return;
    }
    if (!isE164Phone(req.body?.recipientPhone)) {
      res.status(400).json({ code: "INVALID_RECIPIENT_PHONE", error: "Enter the recipient's phone in international format, for example +14155550123." });
      return;
    }
    if (req.body?.permissionConsent !== true || req.body?.relationshipConsent !== true || req.body?.consentVersion !== FAMILY_LINK_CONSENT_VERSION) {
      res.status(400).json({ code: "CONSENT_REQUIRED", error: "Review and accept the family-link consent before continuing." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      if (!getFirebaseIdentityEligibility(claims).allowed) {
        res.status(403).json({ code: "VERIFIED_ACCOUNT_REQUIRED", error: "Verify your Firebase account before creating a family invitation." });
        return;
      }
      const invite = await createFamilyInvite({
        claims,
        recipientPhone: req.body.recipientPhone,
        permissionConsent: true,
        relationshipConsent: true,
        consentVersion: FAMILY_LINK_CONSENT_VERSION,
      });
      res.status(201).json({ invite: { code: invite.code, expiresAt: invite.expiresAt.toISOString(), recipientRole: invite.recipientRole } });
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });

  app.post("/api/family/invites/accept", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to accept an invitation." });
      return;
    }
    if (!isFamilyInviteCode(req.body?.code)) {
      res.status(400).json({ code: "INVALID_INVITATION", error: "Enter a valid ElderCare invitation code." });
      return;
    }
    if (req.body?.consent !== true || req.body?.consentVersion !== FAMILY_LINK_CONSENT_VERSION) {
      res.status(400).json({ code: "CONSENT_REQUIRED", error: "Review and accept the family-link consent before continuing." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      if (!getFirebaseIdentityEligibility(claims).allowed) {
        res.status(403).json({ code: "VERIFIED_ACCOUNT_REQUIRED", error: "Verify your Firebase account before accepting an invitation." });
        return;
      }
      const accepted = await acceptFamilyInvite({
        claims,
        code: req.body.code,
        consent: true,
        consentVersion: FAMILY_LINK_CONSENT_VERSION,
      });
      res.status(200).json(accepted);
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });

  app.get("/api/location/sharing", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to view location-sharing settings." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      if (!getFirebaseIdentityEligibility(claims).allowed) {
        res.status(403).json({ code: "VERIFIED_ACCOUNT_REQUIRED", error: "A verified Firebase account is required for location sharing." });
        return;
      }
      res.json(await getLocationSharingState(claims.uid));
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });

  app.post("/api/location/sharing", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to change location sharing." });
      return;
    }
    if (typeof req.body?.enabled !== "boolean") {
      res.status(400).json({ code: "INVALID_SHARING_SETTING", error: "Choose whether to share your location." });
      return;
    }
    if (req.body.enabled && (req.body?.consent !== true || req.body?.consentVersion !== LOCATION_SHARING_CONSENT_VERSION)) {
      res.status(400).json({ code: "CONSENT_REQUIRED", error: "Review and accept the current location-sharing consent before continuing." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      if (!getFirebaseIdentityEligibility(claims).allowed) {
        res.status(403).json({ code: "VERIFIED_ACCOUNT_REQUIRED", error: "A verified Firebase account is required for location sharing." });
        return;
      }
      res.json(await setLocationSharing({
        claims,
        enabled: req.body.enabled,
        consent: req.body.consent === true,
        consentVersion: typeof req.body.consentVersion === "string" ? req.body.consentVersion : undefined,
      }));
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });

  app.post("/api/location/current", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase before sharing a location." });
      return;
    }
    if (!isValidLocationUpload(req.body)) {
      res.status(400).json({ code: "LOCATION_INVALID", error: "The device returned an invalid location or accuracy value." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      if (!getFirebaseIdentityEligibility(claims).allowed) {
        res.status(403).json({ code: "VERIFIED_ACCOUNT_REQUIRED", error: "A verified Firebase account is required for location sharing." });
        return;
      }
      res.status(202).json(await updateOwnLocation({ claims, point: req.body, generation: req.body.generation }));
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });

  app.get("/api/location/family", async (req, res) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ code: "FIREBASE_TOKEN_REQUIRED", error: "Sign in with Firebase to view shared family locations." });
      return;
    }
    try {
      const claims = await verifyFirebaseIdToken(token);
      if (!getFirebaseIdentityEligibility(claims).allowed) {
        res.status(403).json({ code: "VERIFIED_ACCOUNT_REQUIRED", error: "A verified Firebase account is required to view shared locations." });
        return;
      }
      res.json({ locations: await getSharedFamilyLocations(claims.uid) });
    } catch (error) {
      sendFirebaseError(res, error);
    }
  });
}
