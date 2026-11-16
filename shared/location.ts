export const LOCATION_SHARING_CONSENT_VERSION = "2026-11-16";
export const LOCATION_MAX_AGE_MS = 5 * 60 * 1000;
export const LOCATION_UPDATE_MIN_INTERVAL_MS = 5 * 1000;

export type LocationPointInput = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
};

export type SharedFamilyLocation = LocationPointInput & {
  displayName: string;
  role: "parent" | "child";
  updatedAt: string;
};

export function isLocationGenerationCurrent(enabled: unknown, activeGeneration: unknown, requestGeneration: unknown): boolean {
  return enabled === true && Number.isSafeInteger(activeGeneration) && Number.isSafeInteger(requestGeneration) &&
    typeof activeGeneration === "number" && activeGeneration > 0 && activeGeneration === requestGeneration;
}

export function isLocationFresh(updatedAtMs: number, nowMs: number): boolean {
  if (!Number.isFinite(updatedAtMs) || !Number.isFinite(nowMs)) return false;
  const age = nowMs - updatedAtMs;
  return age >= 0 && age <= LOCATION_MAX_AGE_MS;
}

export function isFamilyLocationReadAuthorized(input: {
  viewerUid: string;
  viewerRole: "parent" | "child";
  parentUid: string;
  childUid: string;
  relationshipId: string;
  parentRole: unknown;
  childRole: unknown;
  relationshipActive: boolean;
  relationshipIdValid: boolean;
  ownerSharingEnabled: boolean;
  ownerAllowedRelationshipIds: unknown;
}): boolean {
  if (!input.relationshipActive || !input.relationshipIdValid || input.parentUid === input.childUid) return false;
  const viewerIsParent = input.viewerUid === input.parentUid && input.viewerRole === "parent";
  const viewerIsChild = input.viewerUid === input.childUid && input.viewerRole === "child";
  if (!viewerIsParent && !viewerIsChild) return false;
  if (input.parentRole !== "parent" || input.childRole !== "child" || !input.ownerSharingEnabled) return false;
  const ownerUid = viewerIsParent ? input.childUid : input.parentUid;
  const allowedIds = input.ownerAllowedRelationshipIds;
  return ownerUid !== input.viewerUid && Array.isArray(allowedIds) && allowedIds.includes(input.relationshipId);
}

export function isValidLocationPoint(value: unknown): value is LocationPointInput {
  if (typeof value !== "object" || value === null) return false;
  const point = value as Record<string, unknown>;
  return typeof point.latitude === "number" && Number.isFinite(point.latitude) && point.latitude >= -90 && point.latitude <= 90 &&
    typeof point.longitude === "number" && Number.isFinite(point.longitude) && point.longitude >= -180 && point.longitude <= 180 &&
    typeof point.accuracyMeters === "number" && Number.isFinite(point.accuracyMeters) && point.accuracyMeters >= 0 && point.accuracyMeters <= 10_000;
}

export function isValidLocationUpload(value: unknown): value is LocationPointInput & { generation: number } {
  if (!isValidLocationPoint(value)) return false;
  const generation = (value as Record<string, unknown>).generation;
  return typeof generation === "number" && Number.isSafeInteger(generation) && generation > 0;
}
