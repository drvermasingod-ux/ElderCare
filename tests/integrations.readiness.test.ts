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
  it("reports Firebase as not implemented even when all Admin env fields exist", () => {
    ENV.firebaseProjectId = "test-project";
    ENV.firebaseClientEmail = "service@example.invalid";
    ENV.firebasePrivateKey = "test-private-key";

    const firebase = getIntegrationStatus().find((item) => item.provider === "Firebase Auth / Firestore / FCM");
    expect(firebase).toMatchObject({
      configured: true,
      implementation: "not-implemented",
      productionReady: false,
    });
    expect(firebase?.notes).toContain("does not enable Firebase Auth token verification");
  });

  it("returns no fabricated reminder when the Gemini provider is absent", async () => {
    ENV.geminiApiKey = "";

    await expect(
      generateReminderScript({ elderName: "Test Elder", medicine: "Test Medicine" }),
    ).resolves.toEqual({ configured: false, text: null, model: "disabled" });
  });
});
