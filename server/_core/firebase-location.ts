import { createHash } from "node:crypto";
import { FieldValue, Timestamp, type Transaction } from "firebase-admin/firestore";
import { isFamilyLocationReadAuthorized, isLocationFresh, isLocationGenerationCurrent, LOCATION_MAX_AGE_MS, LOCATION_SHARING_CONSENT_VERSION, LOCATION_UPDATE_MIN_INTERVAL_MS, isValidLocationPoint, type LocationPointInput, type SharedFamilyLocation } from "../../shared/location";
import { isSignupRole, type SignupRole } from "../../shared/firebase-auth";
import { getFirebaseAdminFirestore, getFirebaseProfile, type FirebaseIdentityClaims, type FirebaseProfile } from "./firebase";

const LOCATION_RATE_WINDOW_MS = 60 * 60 * 1000;
const LOCATION_RATE_MAX = 240;

export class LocationServiceError extends Error {
  constructor(readonly code: "ACCOUNT_NOT_READY" | "CONSENT_REQUIRED" | "SHARING_DISABLED" | "RATE_LIMITED" | "LOCATION_INVALID" | "TOO_MANY_LINKS") {
    super(code);
    this.name = "LocationServiceError";
  }
}

function relationshipId(parentUid: string, childUid: string): string {
  return createHash("sha256").update(`${parentUid}\u0000${childUid}`, "utf8").digest("hex");
}

function activeRole(data: FirebaseFirestore.DocumentData | undefined): SignupRole | null {
  return data?.status === "active" && isSignupRole(data.role) ? data.role : null;
}

async function activeProfile(uid: string): Promise<FirebaseProfile> {
  const profile = await getFirebaseProfile(uid);
  if (!profile) throw new LocationServiceError("ACCOUNT_NOT_READY");
  return profile;
}

function asDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
}

async function activeFamilyLinkIds(uid: string, profile: FirebaseProfile): Promise<string[]> {
  const db = getFirebaseAdminFirestore();
  const query = db.collection("familyRelationships").where(profile.role === "parent" ? "parentUid" : "childUid", "==", uid);
  const snapshot = await query.get();
  const links = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.status === "active" && typeof data.parentUid === "string" && typeof data.childUid === "string" &&
      data.parentUid !== data.childUid && data.parentUid === (profile.role === "parent" ? uid : data.parentUid) &&
      data.childUid === (profile.role === "child" ? uid : data.childUid) &&
      doc.id === relationshipId(data.parentUid, data.childUid);
  });
  const valid = await Promise.all(links.map(async (doc) => {
    const data = doc.data();
    const otherUid = profile.role === "parent" ? data.childUid : data.parentUid;
    try {
      const other = await getFirebaseProfile(otherUid);
      return other && other.role === (profile.role === "parent" ? "child" : "parent") ? doc.id : null;
    } catch {
      return null;
    }
  }));
  return valid.filter((id): id is string => id !== null);
}

async function transactionFamilyLinkIds(transaction: Transaction, db: ReturnType<typeof getFirebaseAdminFirestore>, uid: string, profile: FirebaseProfile): Promise<string[]> {
  const field = profile.role === "parent" ? "parentUid" : "childUid";
  const snapshot = await transaction.get(db.collection("familyRelationships").where(field, "==", uid));
  if (snapshot.docs.length > 50) throw new LocationServiceError("TOO_MANY_LINKS");
  const candidates = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return data.status === "active" && typeof data.parentUid === "string" && typeof data.childUid === "string" &&
      data.parentUid !== data.childUid && data[field] === uid &&
      doc.id === relationshipId(data.parentUid, data.childUid);
  });
  const otherUids = [...new Set(candidates.map((doc) => profile.role === "parent" ? String(doc.data().childUid) : String(doc.data().parentUid)))];
  const profileSnapshots = await Promise.all(otherUids.map((otherUid) => transaction.get(db.collection("users").doc(otherUid))));
  const otherRoles = new Map(otherUids.map((otherUid, index) => [otherUid, activeRole(profileSnapshots[index]?.data())]));
  return candidates.filter((doc) => {
    const otherUid = profile.role === "parent" ? String(doc.data().childUid) : String(doc.data().parentUid);
    return otherRoles.get(otherUid) === (profile.role === "parent" ? "child" : "parent");
  }).map((doc) => doc.id);
}

export async function getLocationSharingState(uid: string): Promise<{ enabled: boolean; generation: number | null; linkedFamilyCount: number }> {
  const profile = await activeProfile(uid);
  const db = getFirebaseAdminFirestore();
  const [sharingSnapshot, links] = await Promise.all([
    db.collection("locationSharing").doc(uid).get(),
    activeFamilyLinkIds(uid, profile),
  ]);
  const sharing = sharingSnapshot.data();
  const allowedIds = Array.isArray(sharing?.allowedRelationshipIds) ? sharing.allowedRelationshipIds : [];
  const enabled = sharing?.enabled === true && Number.isSafeInteger(sharing?.generation) && sharing.generation > 0;
  return {
    enabled,
    generation: enabled ? sharing.generation as number : null,
    linkedFamilyCount: enabled ? links.filter((id) => allowedIds.includes(id)).length : 0,
  };
}

export async function setLocationSharing(input: {
  claims: FirebaseIdentityClaims;
  enabled: boolean;
  consent: boolean;
  consentVersion?: string;
}): Promise<{ enabled: boolean; generation: number | null; linkedFamilyCount: number }> {
  if (input.enabled && (!input.consent || input.consentVersion !== LOCATION_SHARING_CONSENT_VERSION)) {
    throw new LocationServiceError("CONSENT_REQUIRED");
  }
  const profile = await activeProfile(input.claims.uid);
  const db = getFirebaseAdminFirestore();
  const userRef = db.collection("users").doc(input.claims.uid);
  const sharingRef = db.collection("locationSharing").doc(input.claims.uid);
  const latestRef = db.collection("latestLocations").doc(input.claims.uid);
  const auditRef = db.collection("locationAuditEvents").doc();
  let generation: number | null = null;
  let allowedRelationshipIds: string[] = [];

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, sharingSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(sharingRef),
    ]);
    if (!userSnapshot.exists || activeRole(userSnapshot.data()) !== profile.role) {
      throw new LocationServiceError("ACCOUNT_NOT_READY");
    }
    const previousGeneration = sharingSnapshot.data()?.generation;
    const nextGeneration = Number.isSafeInteger(previousGeneration) && previousGeneration >= 0 ? previousGeneration + 1 : 1;
    if (!Number.isSafeInteger(nextGeneration)) throw new LocationServiceError("ACCOUNT_NOT_READY");
    allowedRelationshipIds = input.enabled
      ? await transactionFamilyLinkIds(transaction, db, input.claims.uid, profile)
      : [];
    generation = nextGeneration;

    transaction.set(sharingRef, {
      enabled: input.enabled,
      generation: nextGeneration,
      consentVersion: input.enabled ? input.consentVersion : (sharingSnapshot.data()?.consentVersion ?? null),
      consentAt: input.enabled ? FieldValue.serverTimestamp() : (sharingSnapshot.data()?.consentAt ?? null),
      revokedAt: input.enabled ? null : FieldValue.serverTimestamp(),
      allowedRelationshipIds: allowedRelationshipIds,
      updatedAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
    if (!input.enabled) transaction.delete(latestRef);
    transaction.create(auditRef, {
      action: input.enabled ? "location_sharing_enabled" : "location_sharing_disabled",
      actorUid: input.claims.uid,
      consentVersion: input.enabled ? input.consentVersion : (sharingSnapshot.data()?.consentVersion ?? null),
      linkedFamilyCount: allowedRelationshipIds.length,
      occurredAt: FieldValue.serverTimestamp(),
      schemaVersion: 1,
    });
  });

  return {
    enabled: input.enabled,
    generation: input.enabled ? generation : null,
    linkedFamilyCount: input.enabled ? allowedRelationshipIds.length : 0,
  };
}

export async function updateOwnLocation(input: {
  claims: FirebaseIdentityClaims;
  point: LocationPointInput;
  generation: number;
}): Promise<{ accepted: true; receivedAt: string }> {
  if (!isValidLocationPoint(input.point) || !Number.isSafeInteger(input.generation) || input.generation < 1) {
    throw new LocationServiceError("LOCATION_INVALID");
  }
  const profile = await activeProfile(input.claims.uid);
  const db = getFirebaseAdminFirestore();
  const userRef = db.collection("users").doc(input.claims.uid);
  const sharingRef = db.collection("locationSharing").doc(input.claims.uid);
  const latestRef = db.collection("latestLocations").doc(input.claims.uid);
  const rateRef = db.collection("locationRateLimits").doc(createHash("sha256").update(input.claims.uid, "utf8").digest("hex"));
  const receivedAt = new Date();

  await db.runTransaction(async (transaction) => {
    const [userSnapshot, sharingSnapshot, latestSnapshot, rateSnapshot] = await Promise.all([
      transaction.get(userRef),
      transaction.get(sharingRef),
      transaction.get(latestRef),
      transaction.get(rateRef),
    ]);
    if (!userSnapshot.exists || activeRole(userSnapshot.data()) !== profile.role) throw new LocationServiceError("ACCOUNT_NOT_READY");
    const sharing = sharingSnapshot.data();
    if (!isLocationGenerationCurrent(sharing?.enabled, sharing?.generation, input.generation)) throw new LocationServiceError("SHARING_DISABLED");

    const now = Date.now();
    const previousUpdate = asDate(latestSnapshot.data()?.updatedAt);
    if (previousUpdate && now - previousUpdate.getTime() < LOCATION_UPDATE_MIN_INTERVAL_MS) {
      throw new LocationServiceError("RATE_LIMITED");
    }
    const rate = rateSnapshot.data();
    const windowStartedAt = typeof rate?.windowStartedAtMs === "number" ? rate.windowStartedAtMs : 0;
    const count = typeof rate?.count === "number" ? rate.count : 0;
    const currentCount = now - windowStartedAt >= LOCATION_RATE_WINDOW_MS ? 0 : count;
    if (currentCount >= LOCATION_RATE_MAX) throw new LocationServiceError("RATE_LIMITED");

    transaction.set(rateRef, {
      windowStartedAtMs: currentCount === 0 ? now : windowStartedAt,
      count: currentCount + 1,
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(now + LOCATION_RATE_WINDOW_MS * 2),
    });
    transaction.set(latestRef, {
      latitude: input.point.latitude,
      longitude: input.point.longitude,
      accuracyMeters: input.point.accuracyMeters,
      updatedAt: FieldValue.serverTimestamp(),
      expiresAt: Timestamp.fromMillis(now + LOCATION_MAX_AGE_MS),
      schemaVersion: 1,
    });
  });

  return { accepted: true, receivedAt: receivedAt.toISOString() };
}

export async function getSharedFamilyLocations(uid: string): Promise<SharedFamilyLocation[]> {
  const db = getFirebaseAdminFirestore();
  return db.runTransaction(async (transaction) => {
    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await transaction.get(userRef);
    const callerRole = activeRole(userSnapshot.data());
    if (!callerRole) return [];

    const field = callerRole === "parent" ? "parentUid" : "childUid";
    const linkSnapshot = await transaction.get(db.collection("familyRelationships").where(field, "==", uid));
    const candidates = linkSnapshot.docs.filter((doc) => {
      const relation = doc.data();
      return relation.status === "active" && typeof relation.parentUid === "string" && typeof relation.childUid === "string" &&
        relation.parentUid !== relation.childUid && relation[field] === uid &&
        doc.id === relationshipId(relation.parentUid, relation.childUid);
    });
    if (candidates.length > 50) throw new LocationServiceError("TOO_MANY_LINKS");

    const rows = await Promise.all(candidates.map(async (doc) => {
      const relation = doc.data();
      const otherUid = callerRole === "parent" ? String(relation.childUid) : String(relation.parentUid);
      const [otherUser, otherSharing, locationSnapshot] = await Promise.all([
        transaction.get(db.collection("users").doc(otherUid)),
        transaction.get(db.collection("locationSharing").doc(otherUid)),
        transaction.get(db.collection("latestLocations").doc(otherUid)),
      ]);
      const otherProfileData = otherUser.data();
      const otherRole = activeRole(otherProfileData);
      const expectedRole = callerRole === "parent" ? "child" : "parent";
      const sharing = otherSharing.data();
      const allowedIds: unknown[] = Array.isArray(sharing?.allowedRelationshipIds) ? sharing.allowedRelationshipIds : [];
      if (otherRole !== expectedRole) return null;
      const parentRole = callerRole === "parent" ? callerRole : otherRole;
      const childRole = callerRole === "child" ? callerRole : otherRole;
      if (!isFamilyLocationReadAuthorized({
        viewerUid: uid,
        viewerRole: callerRole,
        parentUid: String(relation.parentUid),
        childUid: String(relation.childUid),
        relationshipId: doc.id,
        parentRole,
        childRole,
        relationshipActive: relation.status === "active",
        relationshipIdValid: doc.id === relationshipId(String(relation.parentUid), String(relation.childUid)),
        ownerSharingEnabled: sharing?.enabled === true,
        ownerAllowedRelationshipIds: allowedIds,
      })) return null;
      if (!locationSnapshot.exists) return null;
      const location = locationSnapshot.data();
      const updatedAt = asDate(location?.updatedAt);
      if (!updatedAt || !isLocationFresh(updatedAt.getTime(), Date.now())) return null;
      const point = {
        latitude: location?.latitude,
        longitude: location?.longitude,
        accuracyMeters: location?.accuracyMeters,
      };
      if (!isValidLocationPoint(point)) return null;
      return {
        displayName: typeof otherProfileData?.displayName === "string" ? otherProfileData.displayName : "Family member",
        role: otherRole,
        ...point,
        updatedAt: updatedAt.toISOString(),
      } satisfies SharedFamilyLocation;
    }));

    return rows.filter((location): location is SharedFamilyLocation => location !== null);
  });
}
