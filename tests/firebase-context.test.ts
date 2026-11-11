import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

vi.mock("../server/_core/firebase", () => ({
  authenticateFirebaseBearer: vi.fn(),
}));

import { authenticateFirebaseBearer } from "../server/_core/firebase";
import { createContext } from "../server/_core/context";
import type { TrpcContext } from "../server/_core/context";

const firebaseUser = {
  id: "firebase:test-uid",
  openId: "test-uid",
  name: "Verified User",
  email: "user@example.com",
  loginMethod: "password",
  role: "parent" as const,
  lastSignedIn: new Date().toISOString(),
  authProvider: "firebase" as const,
};

function options(authorization?: string, cookie?: string) {
  const headers: Record<string, string> = {};
  if (authorization) headers.authorization = authorization;
  if (cookie) headers.cookie = cookie;
  return {
    req: {
      headers,
      header: (name: string) => headers[name.toLowerCase()],
    } as unknown as TrpcContext["req"],
    res: {} as TrpcContext["res"],
    info: {} as CreateExpressContextOptions["info"],
  };
}

beforeEach(() => vi.clearAllMocks());

describe("Firebase tRPC identity context", () => {
  it("uses the verified Firebase identity for an explicit Bearer token", async () => {
    vi.mocked(authenticateFirebaseBearer).mockResolvedValue(firebaseUser);

    const ctx = await createContext(options("Bearer firebase-id-token"));

    expect(authenticateFirebaseBearer).toHaveBeenCalledWith("firebase-id-token");
    expect(ctx.user).toEqual(firebaseUser);
  });

  it("rejects an invalid Firebase Bearer without consulting legacy cookies", async () => {
    vi.mocked(authenticateFirebaseBearer).mockResolvedValue(null);

    const ctx = await createContext(options("Bearer invalid-token", "legacy-session=not-valid"));

    expect(authenticateFirebaseBearer).toHaveBeenCalledWith("invalid-token");
    expect(ctx.user).toBeNull();
  });

  it("does not authenticate from a legacy cookie without a Firebase Bearer token", async () => {
    const ctx = await createContext(options(undefined, "legacy-session=not-valid"));

    expect(authenticateFirebaseBearer).not.toHaveBeenCalled();
    expect(ctx.user).toBeNull();
  });
});
