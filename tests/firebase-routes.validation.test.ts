import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { registerFirebaseAuthRoutes } from "../server/_core/firebase-routes";

let baseUrl = "";
let server: Server | undefined;

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerFirebaseAuthRoutes(app);
  const activeServer = app.listen(0);
  server = activeServer;
  await new Promise<void>((resolve) => activeServer.once("listening", resolve));
  const address = activeServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  if (!server) return;
  await new Promise<void>((resolve, reject) => server!.close((error) => error ? reject(error) : resolve()));
});

describe("Firebase auth REST guards", () => {
  it("requires a Firebase token for session lookup", async () => {
    const response = await fetch(`${baseUrl}/api/auth/firebase/me`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "FIREBASE_TOKEN_REQUIRED" });
  });

  it.each(["admin", "staff", "user", "owner"])("rejects public signup role %s before profile writes", async (role) => {
    const response = await fetch(`${baseUrl}/api/auth/firebase/bootstrap`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test.jwt.token" },
      body: JSON.stringify({ role, displayName: "Test User" }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "ROLE_NOT_ALLOWED" });
  });

  it("rejects an invalid display name before profile writes", async () => {
    const response = await fetch(`${baseUrl}/api/auth/firebase/bootstrap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test.jwt.token",
      },
      body: JSON.stringify({ role: "parent", displayName: "<script>" }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_DISPLAY_NAME" });
  });
});
