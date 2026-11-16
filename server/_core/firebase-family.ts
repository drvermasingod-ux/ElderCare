import { createHash, randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { FAMILY_INVITE_TTL_HOURS, FAMILY_LINK_CONSENT_VERSION } from "../../shared/firebase-family";
import { isSignupRole, type SignupRole } from "../../shared/firebase-auth";
import { getFirebaseAdminFirestore, getFirebaseProfile, type FirebaseIdentityClaims, type FirebaseProfile } from "./firebase";

const INVITE_WINDOW_MS = 60 * 60 * 1000;
const INVITE_MAX_PER_WINDOW = 5;
const ACCEPT_WINDOW_MS = 15 * 60 * 1000;
const ACCEPT_MAX_PER_WINDOW = 10;

type FamilyErrorCode = "PHONE_VERIFICATION_REQUIRED" | "ACCOUNT_NOT_READY" | "RATE_LIMITED" | "INVITE_INVALID" | "CONSENT_REQUIRED";

export class FamilyLinkRequestError extends Error {
  constructor(readonly code: FamilyErrorCode) {
    super(code);
    this.name = "FamilyLinkRequestError";
  }
}

export type FamilyLinkRecord = {
  id: string;
  role: SignupRole;
  displayName: string;
  linkedAt: string;
};

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function relationshipId(parentUid: string, childUid: string): string {
  return sha256(`${parentUid}\u0000${childUid}`);
}

function invitePhoneBinding(code: string, phone: string): string {
  return sha256(`${code}\u0000${phone}`);
}

function ensureVerifiedPhone(claims: FirebaseIdentityClaims, expectedPhone?: string): string {
  const phone = claims.phone_number;
  if (typeof phone !== "string" || !/^\+[1-9][0-9]{7,14}$/.test(phone) || (expectedPhone && phone !== expectedPhone)) {
    throw new FamilyLinkRequestError("PHONE_VERIFICATION_REQUIRED");
  }
  return phone;
}

function activeRole(data: FirebaseFirestore.DocumentData | undefined): SignupRole | null {
  return data?.status === "active" && isSignupRole(data.role) ? data.role : null;
}

async function requireActiveProfile(uid: string): Promise<FirebaseProfile> {
  const profile = await getFirebaseProfile(uid);
  if (!profile) throw new FamilyLinkRequestError("ACCOUNT_NOT_READY");
  return profile;
}

async function consumeRateLimit(uid: string, action: "create" | "accept"): Promise<void> {
  const create = action === "create";
  const windowMs = create ? INVITE_WINDOW_MS : ACCEPT_WINDOW_MS;
  const maxCount = create ? INVITE_MAX_PER_WINDOW : ACCEPT_MAX_PER_WINDOW;
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("familyLinkRateLimits").doc(sha256(`${action}:${uid}`));
  const now = Date.now();

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    const data = snapshot.data();
    const startedAt = typeof data?.windowStartedAtMs === "number" ? data.windowStartedAtMs : 0;
    const count = typeof data?.count === "number" ? data.count : 0;
    const currentCount = now - startedAt >= windowMs ? 0 : count;
    if (currentCount >= maxCount) throw new FamilyLinkRequestError("RATE_LIMITED");
    transaction.set(ref, {
      windowStartedAtMs: currentCount === 0 ? now : startedAt,
      count: currentCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}

export async function createFamilyInvite(input: {
  claims: FirebaseIdentityClaims;
  recipientPhone: string;
  permissionConsent: boolean;
  relationshipConsent: boolean;
  consentVersion: string;
}): Promise<{ code: string; expiresAt: Date; recipientRole: SignupRole }> {
  if (!input.permissionConsent || !input.relationshipConsent || input.consentVersion !== FAMILY_LINK_CONSENT_VERSION) {
    throw new FamilyLinkRequestError("CONSENT_REQUIRED");
  }
  const inviterPhone = ensureVerifiedPhone(input.claims);
  if (!/^\+[1-9][0-9]{7,14}$/.test(input.recipientPhone) || input.recipientPhone === inviterPhone) {
    throw new FamilyLinkRequestError("INVITE_INVALID");
  }

  const profile = await requireActiveProfile(input.claims.uid);
  const recipientRole: SignupRole = profile.role === "parent" ? "child" : "parent";
  await consumeRateLimit(input.claims.uid, "create");

  const code = randomBytes(32).toString("base64url");
  const codeHash = sha256(code);
  const expiresAt = new Date(Date.now() + FAMILY_INVITE_TTL_HOURS * 60 * 60 * 1000);
  const db = getFirebaseAdminFirestore();
  const inviteRef = db.collection("familyInvites").doc(codeHash);
  const inviterRef = db.collection("users").doc(input.claims.uid);
  const auditRef = db.collection("familyAuditEvents").doc();

  await db.runTransaction(async (transaction) => {
    const inviterSnapshot = await transaction.get(inviterRef);
    if (!inviterSnapshot.exists || activeRole(inviterSnapshot.data()) !== profile.role) {
      throw new FamilyLinkRequestError("ACCOUNT_NOT_READY");
    }
    transaction.create(inviteRef, {
      inviterUid: input.claims.uid,
      inviterRole: profile.role,
      recipientRole,
      recipientPhoneBinding: invitePhoneBinding(code, input.recipientPhone),
      status: "pending",
      permissionConsentVersion: input.consentVersion,
      permissionConsentAt: FieldValue.serverTimestamp(),
      relationshipConsentVersion: input.consentVersion,
      relationshipConsentAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
      schemaVersion: 1,
    });
    transaction.create(auditRef, {
      action: "family_invite_created",
      actorUid: input.claims.uid,
      inviterRole: profile.role,
      recipientRole,
      inviteHash: codeHash,
      consentVersion: input.consentVersion,
      occurredAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
  });

  return { code, expiresAt, recipientRole };
}

export async function acceptFamilyInvite(input: {
  claims: FirebaseIdentityClaims;
  code: string;
  consent: boolean;
  consentVersion: string;
}): Promise<{ relationship: FamilyLinkRecord; alreadyLinked: boolean }> {
  if (!input.consent || input.consentVersion !== FAMILY_LINK_CONSENT_VERSION) {
    throw new FamilyLinkRequestError("CONSENT_REQUIRED");
  }
  const recipientPhone = ensureVerifiedPhone(input.claims);
  const recipientProfile = await requireActiveProfile(input.claims.uid);
  await consumeRateLimit(input.claims.uid, "accept");

  const db = getFirebaseAdminFirestore();
  const inviteRef = db.collection("familyInvites").doc(sha256(input.code));
  const recipientRef = db.collection("users").doc(input.claims.uid);
  const auditRef = db.collection("familyAuditEvents").doc();
  let result: { relationship: FamilyLinkRecord; alreadyLinked: boolean } | undefined;

  await db.runTransaction(async (transaction) => {
    const transactionNow = new Date();
    const inviteSnapshot = await transaction.get(inviteRef);
    const invite = inviteSnapshot.data();
    const expiresAt = invite?.expiresAt && typeof invite.expiresAt.toDate === "function"
      ? (invite.expiresAt.toDate() as Date)
      : new Date(0);
    if (
      !inviteSnapshot.exists || invite?.status !== "pending" || expiresAt.getTime() <= transactionNow.getTime() ||
      invite?.recipientPhoneBinding !== invitePhoneBinding(input.code, recipientPhone) || invite?.recipientRole !== recipientProfile.role ||
      invite?.inviterUid === input.claims.uid || !isSignupRole(invite?.inviterRole) || invite?.inviterRole === recipientProfile.role
      || invite?.permissionConsentVersion !== FAMILY_LINK_CONSENT_VERSION
      || invite?.relationshipConsentVersion !== FAMILY_LINK_CONSENT_VERSION
    ) {
      throw new FamilyLinkRequestError("INVITE_INVALID");
    }

    const inviterUid = String(invite.inviterUid);
    const inviterRef = db.collection("users").doc(inviterUid);
    const parentUid = recipientProfile.role === "parent" ? input.claims.uid : inviterUid;
    const childUid = recipientProfile.role === "child" ? input.claims.uid : inviterUid;
    const relationshipRef = db.collection("familyRelationships").doc(relationshipId(parentUid, childUid));
    const [inviterSnapshot, recipientSnapshot, relationshipSnapshot] = await Promise.all([
      transaction.get(inviterRef),
      transaction.get(recipientRef),
      transaction.get(relationshipRef),
    ]);
    if (
      !inviterSnapshot.exists || !recipientSnapshot.exists ||
      activeRole(inviterSnapshot.data()) !== invite.inviterRole ||
      activeRole(recipientSnapshot.data()) !== recipientProfile.role
    ) {
      throw new FamilyLinkRequestError("INVITE_INVALID");
    }

    const inviterData = inviterSnapshot.data();
    const inviterDisplayName = typeof inviterData?.displayName === "string" ? inviterData.displayName : "Family member";

    const alreadyLinked = relationshipSnapshot.exists;
    let linkedAt = transactionNow;
    if (alreadyLinked) {
      const relation = relationshipSnapshot.data();
      if (relation?.status !== "active" || relation.parentUid !== parentUid || relation.childUid !== childUid) {
        throw new FamilyLinkRequestError("INVITE_INVALID");
      }
      linkedAt = relation.linkedAt && typeof relation.linkedAt.toDate === "function"
        ? (relation.linkedAt.toDate() as Date)
        : transactionNow;
    } else {
      transaction.create(relationshipRef, {
        parentUid,
        childUid,
        status: "active",
        linkedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        consentVersion: input.consentVersion,
        parentConsentAt: parentUid === input.claims.uid ? FieldValue.serverTimestamp() : invite.relationshipConsentAt,
        childConsentAt: childUid === input.claims.uid ? FieldValue.serverTimestamp() : invite.relationshipConsentAt,
        createdFromInviteHash: sha256(input.code),
        schemaVersion: 1,
      });
    }

    transaction.update(inviteRef, {
      status: "accepted",
      acceptedByUid: input.claims.uid,
      acceptedAt: FieldValue.serverTimestamp(),
    });
    transaction.create(auditRef, {
      action: alreadyLinked ? "invite_accepted_existing_link" : "family_link_created",
      actorUid: input.claims.uid,
      parentUid,
      childUid,
      relationshipId: relationshipRef.id,
      consentVersion: input.consentVersion,
      occurredAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
    result = {
      relationship: {
        id: relationshipRef.id,
        role: invite.inviterRole,
        displayName: inviterDisplayName,
        linkedAt: linkedAt.toISOString(),
      },
      alreadyLinked,
    };
  });

  if (!result) throw new FamilyLinkRequestError("INVITE_INVALID");
  return { relationship: result.relationship, alreadyLinked: result.alreadyLinked };
}

export async function listFamilyRelationships(uid: string): Promise<FamilyLinkRecord[]> {
  const db = getFirebaseAdminFirestore();
  const currentProfile = await requireActiveProfile(uid);
  const [asParent, asChild] = await Promise.all([
    db.collection("familyRelationships").where("parentUid", "==", uid).get(),
    db.collection("familyRelationships").where("childUid", "==", uid).get(),
  ]);
  const docs = [...asParent.docs, ...asChild.docs];
  const seen = new Set<string>();
  const records = await Promise.all(docs.map(async (doc) => {
    if (seen.has(doc.id)) return null;
    seen.add(doc.id);
    const data = doc.data();
    if (data.status !== "active" || typeof data.parentUid !== "string" || typeof data.childUid !== "string" || data.parentUid === data.childUid) return null;
    const callerIsParent = data.parentUid === uid;
    if (!callerIsParent && data.childUid !== uid) return null;
    if (currentProfile.role !== (callerIsParent ? "parent" : "child") || doc.id !== relationshipId(data.parentUid, data.childUid)) return null;
    const otherUid = callerIsParent ? data.childUid : data.parentUid;
    let otherProfile: FirebaseProfile | null;
    try {
      otherProfile = await getFirebaseProfile(otherUid);
    } catch {
      return null;
    }
    if (!otherProfile || otherProfile.role !== (callerIsParent ? "child" : "parent")) return null;
    const linkedAtValue = data.linkedAt;
    const linkedAt = linkedAtValue && typeof linkedAtValue.toDate === "function"
      ? (linkedAtValue.toDate() as Date)
      : new Date(0);
    return {
      id: doc.id,
      role: otherProfile.role,
      displayName: otherProfile.displayName,
      linkedAt: linkedAt.toISOString(),
    } satisfies FamilyLinkRecord;
  }));
  return records.filter((record): record is FamilyLinkRecord => record !== null);
}
