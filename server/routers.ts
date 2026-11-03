import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  createR2DownloadUrl,
  createR2UploadUrl,
  createRazorpayOrder,
  createStripeCheckoutSession,
  generateReminderScript,
  getIntegrationStatus,
  getMapDistance,
  sendTwilioVoiceReminder,
  sendWhatsAppText,
  synthesizeGoogleSpeech,
  transcribeGoogleSpeech,
} from "./integrations";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(getSessionCookieName(ctx.req), {
        ...cookieOptions,
        maxAge: -1,
      });
      return {
        success: true,
      } as const;
    }),
  }),

  integrations: router({
    status: publicProcedure.query(() => getIntegrationStatus()),
    media: router({
      createUploadUrl: protectedProcedure
        .input(z.object({ category: z.enum(["profile", "visit-photo", "medical-vault"]), filename: z.string().min(1).max(160), contentType: z.string().min(1).max(120) }))
        .mutation(async ({ ctx, input }) => {
          const safeFilename = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
          return createR2UploadUrl({ key: `eldercare/${ctx.user.id}/${input.category}/${Date.now()}-${safeFilename}`, contentType: input.contentType });
        }),
      createDownloadUrl: protectedProcedure
        .input(z.object({ key: z.string().min(1).max(512) }))
        .mutation(async ({ input }) => createR2DownloadUrl(input.key)),
    }),
    ai: router({
      reminderScript: protectedProcedure
        .input(z.object({ elderName: z.string().min(1).max(100), medicine: z.string().min(1).max(160), language: z.string().max(20).optional(), context: z.string().max(300).optional() }))
        .mutation(({ input }) => generateReminderScript(input)),
      synthesizeSpeech: protectedProcedure
        .input(z.object({ text: z.string().min(1).max(3000), languageCode: z.string().max(20).optional(), voiceName: z.string().max(80).optional() }))
        .mutation(({ input }) => synthesizeGoogleSpeech(input)),
      transcribeSpeech: protectedProcedure
        .input(z.object({ audioContentBase64: z.string().min(1), languageCode: z.string().max(20).optional() }))
        .mutation(({ input }) => transcribeGoogleSpeech(input)),
      queueVoiceReminder: adminProcedure
        .input(z.object({ to: z.string().min(7).max(30), text: z.string().min(1).max(500) }))
        .mutation(({ input }) => sendTwilioVoiceReminder(input)),
    }),
    maps: router({
      distance: protectedProcedure
        .input(z.object({ origin: z.string().min(1).max(300), destination: z.string().min(1).max(300) }))
        .query(({ input }) => getMapDistance(input)),
    }),
    notifications: router({
      sendWhatsApp: adminProcedure
        .input(z.object({ to: z.string().min(7).max(30), body: z.string().min(1).max(4096) }))
        .mutation(({ input }) => sendWhatsAppText(input)),
    }),
    payments: router({
      createRazorpayOrder: protectedProcedure
        .input(z.object({ amountInPaise: z.number().int().positive(), currency: z.string().length(3).optional(), receipt: z.string().min(1).max(40) }))
        .mutation(({ input }) => createRazorpayOrder(input)),
      createStripeCheckout: protectedProcedure
        .input(z.object({ customerEmail: z.string().email(), amountInCents: z.number().int().positive(), currency: z.string().length(3).optional(), successUrl: z.string().url(), cancelUrl: z.string().url() }))
        .mutation(({ input }) => createStripeCheckoutSession(input)),
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
