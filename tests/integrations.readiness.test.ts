import { afterEach, describe, expect, it } from "vitest";
import { ENV } from "../server/_core/env";
import { getIntegrationStatus, generateReminderScript } from "../server/integrations";

const originalFirebase = {
  projectId: ENV.firebaseProjectId,
  clientEmail: ENV.firebaseClientEmail,
  privateKey: ENV.firebasePrivateKey,
  geminiApiKey: ENV.geminiApiKey,
};

afterEach(() => {
  ENV.firebaseProjectId = originalFirebase.projectId;
  ENV.firebaseClientEmail = originalFirebase.clientEmail;
  ENV.firebasePrivateKey = originalFirebase.privateKey;
  ENV.geminiApiKey = originalFirebase.geminiApiKey;
});

describe("integration readiness honesty", () => {
  it("reports Firebase Auth/profile bootstrap as adapter-only even when Admin env fields exist", () => {
    ENV.firebaseProjectId = "test-project";
    ENV.firebaseClientEmail = "service@example.invalid";
    ENV.firebasePrivateKey = "test-private-key";

    const firebase = getIntegrationStatus().find((item) => item.provider === "Firebase Auth / Firestore / FCM");
    expect(firebase).toMatchObject({
      configured: true,
      implementation: "adapter-only",
      productionReady: false,
    });
    expect(firebase?.notes).toContain("Firebase ID-token verification and Parent/Child profile bootstrap are implemented");
    expect(firebase?.notes).toContain("care records");
  });

  it("does not report Firebase configured when a server credential is missing", () => {
    ENV.firebaseProjectId = "test-project";
    ENV.firebaseClientEmail = "service@example.invalid";
    ENV.firebasePrivateKey = "";

    const firebase = getIntegrationStatus().find((item) => item.provider === "Firebase Auth / Firestore / FCM");
    expect(firebase).toMatchObject({ configured: false, implementation: "adapter-only", productionReady: false });
  });

  it("returns no fabricated reminder when the Gemini provider is absent", async () => {
    ENV.geminiApiKey = "";

    await expect(
      generateReminderScript({ elderName: "Test Elder", medicine: "Test Medicine" }),
    ).resolves.toEqual({ configured: false, text: null, model: "disabled" });
  });
});
