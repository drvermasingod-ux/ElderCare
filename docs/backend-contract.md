# ElderCare backend contract

The mobile frontend fails closed and displays no sample care records. Native Firebase Phone OTP and Email/Password flows, Firebase Admin ID-token verification, and server-side initial Parent/Child profile bootstrap are implemented in source but are not externally configured or device-verified. The care-domain workflows below remain a target contract, not live features.

## Architecture and ownership

Use Firebase Authentication with Phone OTP and Email/Password, Firestore for structured records, Storage for private documents/photos, and a trusted server runtime for privileged mutations and scheduled work. The mobile client may read only records authorized by the server/rules and may submit intent; it must never choose its own role, assignment, payment state, or trusted location.

Suggested collections are `users/{uid}` (`role`, `status`, `linkedElderlyIds`, `phone`, timestamps), `elderlyProfiles/{elderlyId}` (`linkedClientIds`, consent flags, health summaries), `linkingInvites/{inviteId}` (`createdBy`, `targetPhoneHash`, `purpose`, `codeHash`, `expiresAt`, `usedAt`, consent state), `bookings/{bookingId}` (`clientId`, `elderlyId`, `serviceType`, address, requested slot, status), `staffAssignments/{assignmentId}` (`bookingId`, `staffId`, status, checkIn metadata), `visitRecords/{visitId}` (`assignmentId`, measurements, notes, consent, submittedAt), `locationUpdates/{updateId}` (`assignmentId`, point, accuracy, capturedAt), `medicalDocuments/{documentId}` (`elderlyId`, storagePath, type, size, uploader, access list), `sosAlerts/{alertId}` (`elderlyId`, createdBy, status, escalation state, dedupe key), `reminders/{reminderId}` (`elderlyId`, schedule, quiet hours, attempts, outcome), `subscriptions/{subscriptionId}`, `transactions/{transactionId}`, `payouts/{payoutId}`, `leaveRequests/{requestId}`, and `auditLogs/{logId}`.

## Authorization strategy

After Firebase authentication, the API verifies the ID token and retrieves the trusted `users/{uid}` record. Password-provider accounts must have a verified email claim. Missing profile, disabled account, unsupported provider, or invalid role receives a safe denial or setup state. Only initial `parent` or `child` self-registration is allowed; role alone never links an account to another person's care data. Firestore client rules currently deny all reads and writes. Enable any client access only after rules are designed and tested for the specific workflow.

Future Firestore rules should assert `request.auth.uid == uid`, role/status, linked-elder membership, assignment ownership, allowed status transitions, field allowlists, and immutable audit metadata. Clients may read only explicitly linked profiles, their own bookings, authorized visits, permitted medical documents, SOS status, and subscription view. Staff may read only assigned tasks and minimum required client details. Admin data and privileged changes require server-verified admin authorization; users cannot grant themselves admin.

Role changes, assignment/reassignment, SOS creation/escalation, payment/subscription state, payout ledgers, and geofence validation should be trusted server operations. Storage rules must validate owner/assignment, path, content type, and size; disallow directory browsing and cross-profile access. Do not expose raw card details; use tokenized provider flows.

## Trusted event flows (future care-domain scope)

1. **Auth role routing:** Firebase Auth completes Phone OTP or Email/Password sign-in; the API verifies the token, requires verified email for password-provider accounts, then reads the server-owned `users/{uid}` profile. Missing-profile accounts may create only a `parent` or `child` profile. Role choice does not link or reveal another person's data.
2. **Account linking:** parent-first and child-first flows create a server-issued, single-use, short-lived invite record. Hash codes at rest, rate-limit attempts, verify target phone ownership and consent, require both parties to accept, and atomically update linked IDs plus an audit record. The client never chooses final role/linkage.
3. **Keypad phone mode:** after explicit parent consent and phone verification, store only minimum voice-reminder configuration, quiet hours, language, retry policy, and escalation contacts. Apply the same audit and access controls.
4. **Booking:** validate service type, linked-elder ownership, idempotency key, requested date/address/notes, and write booking/audit records server-side.
5. **Check-in:** validate assignment status, fresh device location/accuracy, permission state, and server-side distance to the assigned home. Reject stale/inaccurate or duplicate check-ins and unassigned tasks.
6. **SOS:** require user confirmation and linked-elder authorization, write a deduplicated alert, notify configured contacts/assigned staff, and record actual delivery status. SOS is not a substitute for emergency services.
7. **Medication reminder:** schedule only with persisted consented plan and quiet hours; record every provider attempt and result, bound retries, and distinguish provider failure from no response. Do not state a dose was taken without confirmation.
8. **Visit completion and dispatch:** validate assignment, one-time submission, required measurement units, consent, allowed status transitions, and audited admin actions.

## Required configuration and privacy review

Auth setup needs Firebase project identifiers, Phone and Email/Password providers, Android/iOS client files, EAS signing configuration, Firestore in the intended region, and server-only Firebase Admin credentials. Care launch additionally needs tested Firestore/Storage rules, notification delivery, maps/payments/voice providers as selected, and relevant consent. Review local privacy, retention, medical-record handling, accessibility, localization, and emergency-contact requirements before launch. Automated calls and app alerts do not replace emergency services or human care.

## Test plan

Before enabling care features, test client/staff/admin isolation, suspended/missing-profile routing, Firestore/Storage rules, linked-record access, invalid status transitions, duplicate booking/visit submission, geofence accuracy/rejection, SOS idempotency, reminder retries/provider failure, logout/session cleanup, offline/retry behavior, upload validation, accessibility labels, and narrow-screen layouts. Keep development/test writes isolated from production data.

## Infrastructure adapter surface

`GET /api/integrations/status` is configuration/adapter inventory, not a production-readiness attestation. Firebase Admin verification and initial user-profile bootstrap are implemented, but Firebase is not production-ready until the configured project/credentials/Firestore are verified and real auth tests pass. Care-domain collections/workflows and FCM are not implemented. R2 URL issuance, Gemini, TTS/STT, Twilio, Maps, WhatsApp and payment calls remain provider adapters; they do not implement consent, persistence, delivery receipts, or webhook reconciliation. Missing Gemini credentials return unavailable, never fabricated reminder text. Private R2 downloads are limited to the authenticated user's object-key namespace; the legacy public storage proxy is restricted to flat generated-image keys.

Adapters use server-only variables such as `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_ACCESS_TOKEN`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VOICE_FROM`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`, `GOOGLE_MAPS_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID`. Configuration presence is not provider health. Missing configuration fails closed; demo data is never treated as a provider result.

Before production care activation, implement consented care records/links, FCM and notification delivery states, idempotency, audit and retention, and provider webhook signature verification for any enabled payment or messaging services. Obtain explicit voice/SMS/WhatsApp consent from the parent and recipient.
