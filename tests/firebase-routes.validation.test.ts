import express from "express";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { registerFirebaseAuthRoutes } from "../server/_core/firebase-routes";
import { isE164Phone, isFamilyInviteCode } from "../shared/firebase-family";
import { isValidLocationPoint } from "../shared/location";

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

  it("requires a Firebase bearer token before listing family relationships", async () => {
    const response = await fetch(`${baseUrl}/api/family/links`);
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "FIREBASE_TOKEN_REQUIRED" });
  });

  it("rejects malformed invitation recipient phones before touching Firebase", async () => {
    const response = await fetch(`${baseUrl}/api/family/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test.jwt.token" },
      body: JSON.stringify({ recipientPhone: "555-1212", consent: true, consentVersion: "2026-11-16" }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "INVALID_RECIPIENT_PHONE" });
  });

  it("rejects malformed or omitted family invitation codes before verification", async () => {
    for (const code of ["short", "", null]) {
      const response = await fetch(`${baseUrl}/api/family/invites/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer test.jwt.token" },
        body: JSON.stringify({ code, consent: true, consentVersion: "2026-11-16" }),
      });
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "INVALID_INVITATION" });
    }
  });

  it("rejects invitation requests without separate current permission and relationship consent", async () => {
    const response = await fetch(`${baseUrl}/api/family/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test.jwt.token" },
      body: JSON.stringify({ recipientPhone: "+14155550123", permissionConsent: true, relationshipConsent: false, consentVersion: "2026-11-16" }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "CONSENT_REQUIRED" });
  });

  it("accepts only E.164 phone numbers and high-entropy-shaped codes", () => {
    expect(isE164Phone("+14155550123")).toBe(true);
    expect(isE164Phone("4155550123")).toBe(false);
    expect(isE164Phone("+0123456789")).toBe(false);
    expect(isFamilyInviteCode("a".repeat(43))).toBe(true);
    expect(isFamilyInviteCode("easy-code")).toBe(false);
  });

  it("requires an authenticated Firebase session for location endpoints", async () => {
    for (const path of ["/api/location/sharing", "/api/location/family"]) {
      const response = await fetch(`${baseUrl}${path}`);
      expect(response.status).toBe(401);
      expect(await response.json()).toMatchObject({ code: "FIREBASE_TOKEN_REQUIRED" });
    }
  });

  it("rejects enabling location sharing without current explicit consent", async () => {
    const response = await fetch(`${baseUrl}/api/location/sharing`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test.jwt.token" },
      body: JSON.stringify({ enabled: true, consent: false, consentVersion: "2026-11-16" }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "CONSENT_REQUIRED" });
  });

  it("rejects invalid location coordinates before Firebase verification", async () => {
    const response = await fetch(`${baseUrl}/api/location/current`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test.jwt.token" },
      body: JSON.stringify({ latitude: 91, longitude: 0, accuracyMeters: 5 }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "LOCATION_INVALID" });
  });

  it("rejects a location upload without its server-issued consent generation", async () => {
    const response = await fetch(`${baseUrl}/api/location/current`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer test.jwt.token" },
      body: JSON.stringify({ latitude: 51.5, longitude: -0.12, accuracyMeters: 25 }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ code: "LOCATION_INVALID" });
  });

  it("accepts only finite bounded coordinates and accuracy values", () => {
    expect(isValidLocationPoint({ latitude: 51.5, longitude: -0.12, accuracyMeters: 25 })).toBe(true);
    expect(isValidLocationPoint({ latitude: -90, longitude: 180, accuracyMeters: 0 })).toBe(true);
    expect(isValidLocationPoint({ latitude: Number.NaN, longitude: 0, accuracyMeters: 10 })).toBe(false);
    expect(isValidLocationPoint({ latitude: 0, longitude: 181, accuracyMeters: 10 })).toBe(false);
    expect(isValidLocationPoint({ latitude: 0, longitude: 0, accuracyMeters: 10001 })).toBe(false);
  });
});
