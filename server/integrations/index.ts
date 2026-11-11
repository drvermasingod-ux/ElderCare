import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { ENV } from "../_core/env";
import { isFirebaseAdminConfigured } from "../_core/firebase";

export type IntegrationStatus = {
  provider: string;
  configured: boolean;
  implementation: "adapter-only" | "not-implemented";
  productionReady: false;
  mode: "server-only";
  notes: string;
};

function configured(...values: string[]) {
  return values.every(Boolean);
}

export function getIntegrationStatus(): IntegrationStatus[] {
  return [
    { provider: "Cloudflare R2", configured: configured(ENV.r2AccountId, ENV.r2AccessKeyId, ENV.r2SecretAccessKey, ENV.r2Bucket), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Signed URL adapter only; file metadata, consent, relationship access, and retention workflows are not implemented." },
    { provider: "Firebase Auth / Firestore / FCM", configured: isFirebaseAdminConfigured(), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Firebase ID-token verification and Parent/Child profile bootstrap are implemented. Native Firebase app setup must be completed; care records, consented family linking, FCM, and end-to-end provider verification remain incomplete." },
    { provider: "Google Gemini", configured: Boolean(ENV.geminiApiKey), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Text-generation adapter only; care check-in and reminder delivery workflows are not implemented." },
    { provider: "Google Cloud TTS / STT", configured: configured(ENV.googleCloudProjectId, ENV.googleCloudAccessToken), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Speech API adapters only; consented care workflows are not implemented." },
    { provider: "Twilio Voice / Exotel", configured: configured(ENV.twilioAccountSid, ENV.twilioAuthToken, ENV.twilioVoiceFrom) || Boolean(ENV.exotelApiKey), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Provider-call adapter only; no persisted schedule, consent, retry, or escalation workflow." },
    { provider: "Razorpay", configured: configured(ENV.razorpayKeyId, ENV.razorpayKeySecret), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Order-creation adapter only; no catalog-priced entitlement or verified webhook workflow." },
    { provider: "Stripe", configured: Boolean(ENV.stripeSecretKey), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Checkout adapter only; no verified webhook or entitlement reconciliation workflow." },
    { provider: "Google Maps", configured: Boolean(ENV.googleMapsApiKey), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Distance API adapter only; no assignment/geofence workflow." },
    { provider: "WhatsApp Cloud API", configured: configured(ENV.whatsappAccessToken, ENV.whatsappPhoneNumberId), implementation: "adapter-only", productionReady: false, mode: "server-only", notes: "Message-send adapter only; consent, delivery tracking, and audit workflows are not implemented." },
  ];
}

function getR2Client() {
  if (!configured(ENV.r2AccountId, ENV.r2AccessKeyId, ENV.r2SecretAccessKey, ENV.r2Bucket)) {
    throw new Error("Cloudflare R2 is not configured on the server");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${ENV.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: ENV.r2AccessKeyId, secretAccessKey: ENV.r2SecretAccessKey },
  });
}

function safeObjectKey(key: string) {
  const normalized = key.replace(/^\/+/, "").replace(/\\/g, "/");
  if (!normalized || normalized.includes("..") || normalized.startsWith("/")) throw new Error("Invalid object key");
  return normalized;
}

export async function createR2UploadUrl(input: { key: string; contentType: string }) {
  const key = safeObjectKey(input.key);
  const client = getR2Client();
  const url = await getSignedUrl(client, new PutObjectCommand({ Bucket: ENV.r2Bucket, Key: key, ContentType: input.contentType }), { expiresIn: 600 });
  return { key, url, expiresInSeconds: 600 };
}

export async function createR2DownloadUrl(keyInput: string) {
  const key = safeObjectKey(keyInput);
  const client = getR2Client();
  const url = await getSignedUrl(client, new GetObjectCommand({ Bucket: ENV.r2Bucket, Key: key }), { expiresIn: 300 });
  return { key, url, expiresInSeconds: 300 };
}

export async function generateReminderScript(input: { elderName: string; medicine: string; language?: string; context?: string }) {
  if (!ENV.geminiApiKey) {
    return { configured: false, text: null, model: "disabled" };
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(ENV.geminiModel)}:generateContent?key=${encodeURIComponent(ENV.geminiApiKey)}`;
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `Create one short, respectful ${input.language || "Hindi"} medication reminder for an elderly person. Elder name: ${input.elderName}. Medicine: ${input.medicine}. Context: ${input.context || "scheduled reminder"}. Do not claim emergency help or medical advice.` }] }] }) });
  if (!response.ok) throw new Error(`Gemini request failed with ${response.status}`);
  const body = (await response.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return { configured: true, text: body.candidates?.[0]?.content?.parts?.[0]?.text || "Reminder unavailable", model: ENV.geminiModel };
}

export async function sendTwilioVoiceReminder(input: { to: string; text: string }) {
  if (!configured(ENV.twilioAccountSid, ENV.twilioAuthToken, ENV.twilioVoiceFrom)) return { configured: false, queued: false, provider: "twilio" };
  const auth = Buffer.from(`${ENV.twilioAccountSid}:${ENV.twilioAuthToken}`).toString("base64");
  const body = new URLSearchParams({ To: input.to, From: ENV.twilioVoiceFrom, Twiml: `<Response><Say language="hi-IN">${escapeXml(input.text)}</Say></Response>` });
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${ENV.twilioAccountSid}/Calls.json`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error(`Twilio call request failed with ${response.status}`);
  const result = (await response.json()) as { sid?: string; status?: string };
  return { configured: true, queued: true, provider: "twilio", callId: result.sid, status: result.status };
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] || character);
}

export async function getMapDistance(input: { origin: string; destination: string }) {
  if (!ENV.googleMapsApiKey) return { configured: false, distanceMeters: null, durationSeconds: null };
  const url = new URL("https://maps.googleapis.com/maps/api/distancematrix/json");
  url.searchParams.set("origins", input.origin);
  url.searchParams.set("destinations", input.destination);
  url.searchParams.set("key", ENV.googleMapsApiKey);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Google Maps request failed with ${response.status}`);
  const body = (await response.json()) as { rows?: Array<{ elements?: Array<{ distance?: { value?: number }; duration?: { value?: number } }> }> };
  const element = body.rows?.[0]?.elements?.[0];
  return { configured: true, distanceMeters: element?.distance?.value ?? null, durationSeconds: element?.duration?.value ?? null };
}

export async function sendWhatsAppText(input: { to: string; body: string }) {
  if (!configured(ENV.whatsappAccessToken, ENV.whatsappPhoneNumberId)) return { configured: false, sent: false };
  const response = await fetch(`https://graph.facebook.com/v21.0/${ENV.whatsappPhoneNumberId}/messages`, { method: "POST", headers: { Authorization: `Bearer ${ENV.whatsappAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ messaging_product: "whatsapp", to: input.to, type: "text", text: { body: input.body } }) });
  if (!response.ok) throw new Error(`WhatsApp request failed with ${response.status}`);
  const body = (await response.json()) as { messages?: Array<{ id?: string }> };
  return { configured: true, sent: true, messageId: body.messages?.[0]?.id };
}

export async function createRazorpayOrder(input: { amountInPaise: number; currency?: string; receipt: string }) {
  if (!configured(ENV.razorpayKeyId, ENV.razorpayKeySecret)) return { configured: false, created: false };
  const auth = Buffer.from(`${ENV.razorpayKeyId}:${ENV.razorpayKeySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify({ amount: input.amountInPaise, currency: input.currency || "INR", receipt: input.receipt, payment_capture: 1 }) });
  if (!response.ok) throw new Error(`Razorpay order request failed with ${response.status}`);
  const body = (await response.json()) as { id?: string; status?: string };
  return { configured: true, created: true, orderId: body.id, status: body.status };
}


export async function synthesizeGoogleSpeech(input: { text: string; languageCode?: string; voiceName?: string }) {
  if (!configured(ENV.googleCloudProjectId, ENV.googleCloudAccessToken)) return { configured: false, audioContentBase64: null };
  const response = await fetch("https://texttospeech.googleapis.com/v1/text:synthesize", { method: "POST", headers: { Authorization: `Bearer ${ENV.googleCloudAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ input: { text: input.text }, voice: { languageCode: input.languageCode || "hi-IN", name: input.voiceName }, audioConfig: { audioEncoding: "MP3" } }) });
  if (!response.ok) throw new Error(`Google TTS request failed with ${response.status}`);
  const body = (await response.json()) as { audioContent?: string };
  return { configured: true, audioContentBase64: body.audioContent || null };
}

export async function transcribeGoogleSpeech(input: { audioContentBase64: string; languageCode?: string }) {
  if (!configured(ENV.googleCloudProjectId, ENV.googleCloudAccessToken)) return { configured: false, transcript: null };
  const response = await fetch("https://speech.googleapis.com/v1/speech:recognize", { method: "POST", headers: { Authorization: `Bearer ${ENV.googleCloudAccessToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ config: { encoding: "MP3", languageCode: input.languageCode || "hi-IN", enableAutomaticPunctuation: true }, audio: { content: input.audioContentBase64 } }) });
  if (!response.ok) throw new Error(`Google STT request failed with ${response.status}`);
  const body = (await response.json()) as { results?: Array<{ alternatives?: Array<{ transcript?: string }> }> };
  return { configured: true, transcript: body.results?.map((item) => item.alternatives?.[0]?.transcript || "").filter(Boolean).join(" ") || "" };
}

export async function createStripeCheckoutSession(input: { customerEmail: string; amountInCents: number; currency?: string; successUrl: string; cancelUrl: string }) {
  if (!ENV.stripeSecretKey) return { configured: false, created: false };
  const body = new URLSearchParams({ mode: "payment", success_url: input.successUrl, cancel_url: input.cancelUrl, customer_email: input.customerEmail, "line_items[0][price_data][currency]": input.currency || "usd", "line_items[0][price_data][product_data][name]": "ElderCare Companion plan", "line_items[0][price_data][unit_amount]": String(input.amountInCents), "line_items[0][quantity]": "1" });
  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${ENV.stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error(`Stripe checkout request failed with ${response.status}`);
  const result = (await response.json()) as { id?: string; url?: string; status?: string };
  return { configured: true, created: true, sessionId: result.id, url: result.url, status: result.status };
}
