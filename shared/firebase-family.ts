export const FAMILY_LINK_CONSENT_VERSION = "2026-11-16";
export const FAMILY_INVITE_TTL_HOURS = 24;

export type FamilyLinkInvite = {
  code: string;
  expiresAt: string;
};

export type FamilyLinkRecord = {
  id: string;
  role: "parent" | "child";
  displayName: string;
  linkedAt: string;
};

export type FamilyRelationshipView = {
  id: string;
  role: "parent" | "child";
  displayName: string;
  linkedAt: string;
};

export function isE164Phone(value: unknown): value is string {
  return typeof value === "string" && /^\+[1-9][0-9]{7,14}$/.test(value);
}

export function isFamilyInviteCode(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{40,60}$/.test(value);
}
