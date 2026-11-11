import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { isOwnedPrivateMediaKey } from "./_core/mediaAccess";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createR2DownloadUrl,
  getIntegrationStatus,
  sendTwilioVoiceReminder,
  sendWhatsAppText,
} from "./integrations";

function unavailableWorkflow(feature: string): never {
  throw new TRPCError({
    code: "PRECONDITION_FAILED",
    message: `${feature} is unavailable until its consent, authorization, and server-confirmed workflow is implemented.`,
  });
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
  }),

  integrations: router({
    status: publicProcedure.query(() => getIntegrationStatus()),
    media: router({
      createUploadUrl: protectedProcedure
        .input(z.object({ category: z.enum(["profile", "visit-photo", "medical-vault"]), filename: z.string().min(1).max(160), contentType: z.string().min(1).max(120) }))
        .mutation(() => unavailableWorkflow("Private file uploads")),
      createDownloadUrl: protectedProcedure
        .input(z.object({ key: z.string().min(1).max(512) }))
        .mutation(async ({ ctx, input }) => {
          if (!isOwnedPrivateMediaKey(input.key, ctx.user.id)) {
            throw new TRPCError({ code: "FORBIDDEN", message: "File access denied." });
          }
          return createR2DownloadUrl(input.key);
        }),
    }),
    ai: router({
      reminderScript: protectedProcedure
        .input(z.object({ elderName: z.string().min(1).max(100), medicine: z.string().min(1).max(160), language: z.string().max(20).optional(), context: z.string().max(300).optional() }))
        .mutation(() => unavailableWorkflow("AI-generated care reminders")),
      synthesizeSpeech: protectedProcedure
        .input(z.object({ text: z.string().min(1).max(3000), languageCode: z.string().max(20).optional(), voiceName: z.string().max(80).optional() }))
        .mutation(() => unavailableWorkflow("Care text-to-speech")),
      transcribeSpeech: protectedProcedure
        .input(z.object({ audioContentBase64: z.string().min(1), languageCode: z.string().max(20).optional() }))
        .mutation(() => unavailableWorkflow("Care audio transcription")),
      queueVoiceReminder: adminProcedure
        .input(z.object({ to: z.string().min(7).max(30), text: z.string().min(1).max(500) }))
        .mutation(({ input }) => sendTwilioVoiceReminder(input)),
    }),
    maps: router({
      distance: protectedProcedure
        .input(z.object({ origin: z.string().min(1).max(300), destination: z.string().min(1).max(300) }))
        .query(() => unavailableWorkflow("Care-partner distance lookup")),
    }),
    notifications: router({
      sendWhatsApp: adminProcedure
        .input(z.object({ to: z.string().min(7).max(30), body: z.string().min(1).max(4096) }))
        .mutation(({ input }) => sendWhatsAppText(input)),
    }),
    payments: router({
      createRazorpayOrder: protectedProcedure
        .input(z.object({ amountInPaise: z.number().int().positive(), currency: z.string().length(3).optional(), receipt: z.string().min(1).max(40) }))
        .mutation(() => unavailableWorkflow("Razorpay orders")),
      createStripeCheckout: protectedProcedure
        .input(z.object({ customerEmail: z.string().email(), amountInCents: z.number().int().positive(), currency: z.string().length(3).optional(), successUrl: z.string().url(), cancelUrl: z.string().url() }))
        .mutation(() => unavailableWorkflow("Stripe checkout")),
    }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
