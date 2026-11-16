import { describe, expect, it } from "vitest";
import { isFamilyLocationReadAuthorized, isLocationFresh, isLocationGenerationCurrent, isValidLocationUpload, LOCATION_MAX_AGE_MS } from "../shared/location";

const relationship = {
  viewerUid: "parent-uid",
  viewerRole: "parent" as const,
  parentUid: "parent-uid",
  childUid: "child-uid",
  relationshipId: "relationship-1",
  parentRole: "parent",
  childRole: "child",
  relationshipActive: true,
  relationshipIdValid: true,
  ownerSharingEnabled: true,
  ownerAllowedRelationshipIds: ["relationship-1"],
};

describe("location-sharing authorization policy", () => {
  it("allows an explicitly authorized linked reader without requiring the reader to share their own location", () => {
    expect(isFamilyLocationReadAuthorized(relationship)).toBe(true);
  });

  it("allows either role to read the counterpart's point when the point owner opted in", () => {
    expect(isFamilyLocationReadAuthorized({
      ...relationship,
      viewerUid: "child-uid",
      viewerRole: "child",
    })).toBe(true);
  });

  it.each([
    ["future relationship not in consent snapshot", { relationshipId: "future-link" }],
    ["inactive relationship", { relationshipActive: false }],
    ["relationship ID mismatch", { relationshipIdValid: false }],
    ["owner did not enable sharing", { ownerSharingEnabled: false }],
    ["unrelated reader", { viewerUid: "stranger-uid" }],
    ["wrong role", { viewerRole: "child" as const }],
    ["wrong parent profile role", { parentRole: "staff" }],
    ["malformed consent snapshot", { ownerAllowedRelationshipIds: "relationship-1" }],
  ])("denies %s", (_description, changes) => {
    expect(isFamilyLocationReadAuthorized({ ...relationship, ...changes })).toBe(false);
  });

  it("accepts only the currently enabled server-issued sharing generation", () => {
    expect(isLocationGenerationCurrent(true, 7, 7)).toBe(true);
    expect(isLocationGenerationCurrent(false, 7, 7)).toBe(false);
    expect(isLocationGenerationCurrent(true, 8, 7)).toBe(false);
    expect(isLocationGenerationCurrent(true, "7", 7)).toBe(false);
    expect(isLocationGenerationCurrent(true, 0, 0)).toBe(false);
  });

  it("hides stale or future-dated points and accepts only the five-minute window", () => {
    const now = 1_800_000_000_000;
    expect(isLocationFresh(now, now)).toBe(true);
    expect(isLocationFresh(now - LOCATION_MAX_AGE_MS, now)).toBe(true);
    expect(isLocationFresh(now - LOCATION_MAX_AGE_MS - 1, now)).toBe(false);
    expect(isLocationFresh(now + 1, now)).toBe(false);
    expect(isLocationFresh(Number.NaN, now)).toBe(false);
  });

  it("requires a positive integer generation on every location upload", () => {
    const point = { latitude: 51.5, longitude: -0.12, accuracyMeters: 25 };
    expect(isValidLocationUpload({ ...point, generation: 1 })).toBe(true);
    expect(isValidLocationUpload(point)).toBe(false);
    expect(isValidLocationUpload({ ...point, generation: 0 })).toBe(false);
    expect(isValidLocationUpload({ ...point, generation: 1.5 })).toBe(false);
  });
});
