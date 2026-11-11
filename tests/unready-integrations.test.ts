import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

function parentCaller() {
  const ctx: TrpcContext = {
    user: {
      id: "firebase:test-parent",
      openId: "test-parent",
      name: "Test Parent",
      email: "parent@example.com",
      loginMethod: "password",
      role: "parent",
      lastSignedIn: new Date().toISOString(),
      authProvider: "firebase",
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
  return appRouter.createCaller(ctx);
}

describe("care provider workflows remain fail-closed", () => {
  it("does not issue file uploads before consent and file-validation workflows exist", async () => {
    await expect(parentCaller().integrations.media.createUploadUrl({
      category: "medical-vault",
      filename: "document.pdf",
      contentType: "application/pdf",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("does not send personal care content to AI providers before consent exists", async () => {
    await expect(parentCaller().integrations.ai.reminderScript({
      elderName: "Test Elder",
      medicine: "Test Medicine",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("does not create payment sessions at client-supplied amounts", async () => {
    await expect(parentCaller().integrations.payments.createRazorpayOrder({
      amountInPaise: 100,
      currency: "INR",
      receipt: "test-receipt",
    })).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("does not disclose the admin messaging endpoint to Parent accounts", async () => {
    await expect(parentCaller().integrations.notifications.sendWhatsApp({
      to: "+15555550123",
      body: "Test message",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
