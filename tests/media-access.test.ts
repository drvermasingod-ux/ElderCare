import { describe, expect, it } from "vitest";
import { isOwnedPrivateMediaKey, isPublicGeneratedAssetKey } from "../server/_core/mediaAccess";

describe("private media ownership", () => {
  it("accepts only the authenticated user's exact category namespace", () => {
    expect(isOwnedPrivateMediaKey("eldercare/42/profile/1730000000000-avatar.png", 42)).toBe(true);
    expect(isOwnedPrivateMediaKey("eldercare/42/medical-vault/1730000000000-lab-report.pdf", 42)).toBe(true);
    expect(isOwnedPrivateMediaKey("eldercare/42/visit-photo/1730000000000-checkin.jpg", "42")).toBe(true);
  });

  it.each([
    ["eldercare/43/profile/1730000000000-avatar.png", 42],
    ["eldercare/42/private/1730000000000-file.pdf", 42],
    ["/eldercare/42/profile/1730000000000-avatar.png", 42],
    ["eldercare/42/profile/../secret.pdf", 42],
    ["eldercare\\42\\profile\\avatar.png", 42],
    ["eldercare/42/medical-vault/nested/file.pdf", 42],
    ["eldercare/42/profile/", 42],
  ])("rejects unowned or malformed key %s", (key, userId) => {
    expect(isOwnedPrivateMediaKey(key, userId)).toBe(false);
  });
});

describe("public legacy generated-asset proxy", () => {
  it("allows only a flat generated image key", () => {
    expect(isPublicGeneratedAssetKey("generated/1730000000000_ab12cd34.png")).toBe(true);
    expect(isPublicGeneratedAssetKey("generated/asset-1.webp")).toBe(true);
  });

  it.each([
    "eldercare/42/medical-vault/report.pdf",
    "generated/../private.png",
    "generated/nested/asset.png",
    "generated/asset name.png",
    "generated\\asset.png",
    "generated/asset.svg",
  ])("rejects private, nested or unsafe key %s", (key) => {
    expect(isPublicGeneratedAssetKey(key)).toBe(false);
  });
});
