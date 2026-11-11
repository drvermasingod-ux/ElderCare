import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { authenticateFirebaseBearer, type FirebaseAppUser } from "./firebase";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: FirebaseAppUser | null;
};

export async function createContext(opts: CreateExpressContextOptions): Promise<TrpcContext> {
  const authorization = opts.req.header("authorization") ?? "";
  const bearerMatch = /^Bearer\s+([A-Za-z0-9._~-]+)$/i.exec(authorization.trim());
  let user: FirebaseAppUser | null = null;

  if (bearerMatch) {
    // A supplied bearer is always a Firebase ID token. Failure is final: no legacy
    // Manus cookie/token is consulted as a fallback.
    try {
      user = await authenticateFirebaseBearer(bearerMatch[1]);
    } catch {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}
