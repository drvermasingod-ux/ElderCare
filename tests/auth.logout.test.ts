import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("Firebase API session", () => {
  it("returns no user when there is no verified Firebase identity", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: { cookie: "legacy-session=old" } } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    await expect(caller.auth.me()).resolves.toBeNull();
  });
});
