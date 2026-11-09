const PRIVATE_CATEGORIES = new Set(["profile", "visit-photo", "medical-vault"]);
const PUBLIC_GENERATED_KEY = /^generated\/[A-Za-z0-9_-]{1,120}\.(?:png|jpe?g|webp)$/i;

/** Only the authenticated user's exact R2 object namespace may be presigned for download. */
export function isOwnedPrivateMediaKey(key: string, userId: string | number): boolean {
  if (!key || key.startsWith("/") || key.includes("\\") || key.includes("..")) return false;
  const segments = key.split("/");
  if (segments.length !== 4) return false;
  const [root, ownerId, category, filename] = segments;
  return (
    root === "eldercare" &&
    ownerId === String(userId) &&
    PRIVATE_CATEGORIES.has(category) &&
    /^[A-Za-z0-9][A-Za-z0-9._-]{0,240}$/.test(filename)
  );
}

/** The unauthenticated legacy proxy may serve only generated, non-personal image assets. */
export function isPublicGeneratedAssetKey(key: string): boolean {
  return !key.includes("..") && !key.includes("\\") && PUBLIC_GENERATED_KEY.test(key);
}
