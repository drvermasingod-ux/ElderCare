# ElderCare backend contract

This mobile slice intentionally uses sample data. The following contract is the implementation boundary for the production Firebase build; the UI must not claim these services are live until configured and tested.

## Architecture and ownership

Use Firebase Authentication with phone OTP, Firestore for structured records, Storage for private documents/photos, and Cloud Functions or another trusted server runtime for privileged mutations and scheduled work. The mobile client may read only records authorized by the server/rules and may submit intent; it must never choose its own role, assignment, payment state, or trusted location.

Suggested collections are `users/{uid}` (`role`, `status`, `linkedElderlyIds`, `phone`, timestamps), `elderlyProfiles/{elderlyId}` (`linkedClientIds`, consent flags, health summaries), `linkingInvites/{inviteId}` (`createdBy`, `targetPhoneHash`, `purpose`, `codeHash`, `expiresAt`, `usedAt`, consent state), `bookings/{bookingId}` (`clientId`, `elderlyId`, `serviceType`, address, requested slot, status), `staffAssignments/{assignmentId}` (`bookingId`, `staffId`, status, checkIn metadata), `visitRecords/{visitId}` (`assignmentId`, measurements, notes, consent, submittedAt`), `locationUpdates/{updateId}` (`assignmentId`, point, accuracy, capturedAt`), `medicalDocuments/{documentId}` (`elderlyId`, storagePath, type, size, uploader, access list), `sosAlerts/{alertId}` (`elderlyId`, createdBy, status, escalation state, dedupe key), `reminders/{reminderId}` (`elderlyId`, schedule, quiet hours, attempts, outcome), `subscriptions/{subscriptionId}`, `transactions/{transactionId}`, `payouts/{payoutId}`, `leaveRequests/{requestId}`, and `auditLogs/{logId}`.

## Authorization strategy

After OTP, retrieve the trusted `users/{uid}` record. Missing, suspended, invalid-role, or missing-profile users receive a safe denial state. Firestore rules should assert `request.auth.uid == uid`, role claims/records, linked elderly membership, assignment ownership, allowed status transitions, field allowlists, and immutable audit metadata. Clients can read only linked elderly profiles, their own bookings, authorized visit feed, medical documents in their access list, SOS status, and subscription view. Staff can read only their assigned tasks and the minimum client details needed for that assignment. Admin data and privileged changes require an admin role verified server-side; users cannot grant themselves admin.

Role changes, assignment/reassignment, SOS creation/escalation, payment/subscription state, payout ledgers, and geofence validation should be Cloud Function endpoints or callable server operations. Storage rules must validate the owner/assignment, document path, content type, and size; disallow directory browsing and cross-elderly access. Do not expose raw card details: use a tokenized provider flow.

## Trusted event flows

1. **OTP role routing:** Firebase Auth completes OTP, server reads `users/{uid}`, checks status/profile, then returns the allowed role and minimal session claims.
2. **Account linking:** parent-first and child-first flows create a server-issued, single-use, short-lived invite record. Hash codes at rest, rate-limit attempts, verify the target phone through OTP/SMS consent, require both parties to accept, and atomically update linked IDs plus an audit record. Direct integration must still verify both phone ownership and consent; the client must never choose the final role or linkage.
3. **Keypad phone mode:** after explicit parent consent and phone verification, store only the minimum voice-reminder configuration, quiet hours, language, retry policy, and escalation contacts. No app install is required, but the same audit and access controls apply.
4. **Booking:** client sends requested service/date/address/notes; server validates allowed service type, linked elderly ownership, idempotency key, and creates the booking/audit record.
5. **Check-in:** staff requests a check-in token; backend checks assignment status, fresh device location/accuracy, permission state, and server-side distance to the assigned home. Reject outside 20 m, stale/inaccurate points, duplicate check-ins, or unassigned tasks; provide dispatch escalation.
6. **SOS:** client confirms, server verifies linked elderly access, writes a deduplicated alert, notifies configured contacts/assigned staff, and records delivery status. SOS is not a substitute for emergency services.
7. **Medication reminder:** a scheduler checks quiet hours and valid consent, asks the voice provider to call, records attempt timestamp/provider outcome, retries up to three attempts within 15 minutes, and creates one deduplicated SOS only after the no-response threshold. Provider failure, invalid number, or connectivity issue is surfaced separately from no response.
   The current mobile slice also offers an on-device daily 18:30 reminder using Expo Notifications. That local reminder is intentionally separate from the trusted family-wide escalation workflow; the UI labels it as phone-only and does not claim that a dose was reliably taken.
6. **Visit completion:** server checks assignment, one-time submission token, required measurements/units, consent for uploads, and allowed transition from in-progress to submitted. It writes the visit and audit record; earnings are derived from trusted records.
7. **Dispatch:** authorized admin function checks eligible available staff, records acting admin/time/reason/previous/new assignment, and appends an audit log.

## Required configuration and privacy review

Production setup needs Firebase project identifiers, Auth phone provider/OTP settings, Firestore/Storage rules, Cloud Functions runtime, notification delivery, mapping provider, tokenized payments, and voice provider credentials stored in the platform secret manager — never in the app bundle. Review local privacy, consent, data-retention, medical-record handling, accessibility, localization, and emergency-contact requirements before launch. Automated calls and app alerts do not replace emergency services or human care.

## Test plan

Test client/staff/admin isolation, suspended and missing-role routing, Firestore/Storage rules, linked-record access, invalid status transitions, duplicate booking and visit submission, 20 m geofence accuracy/staleness/rejection, SOS idempotency, three-attempt reminder escalation and provider failure, secure logout/session cleanup, offline/retry behavior, upload validation, accessibility labels, and narrow-screen layouts. Keep development/test writes isolated from production data.


## Infrastructure adapter surface

The server now exposes a non-secret `GET /api/integrations/status` readiness endpoint and the equivalent `integrations.status` tRPC query. Protected procedures cover R2 upload/download URL issuance, Gemini reminder-script generation, Google TTS/STT, admin-only Twilio voice queueing, Google Maps distance lookup, admin-only WhatsApp messaging, and protected Razorpay/Stripe checkout creation. The client receives only short-lived signed URLs or provider result IDs; provider keys never enter the Expo bundle.

Configure adapters through server-only environment variables such as `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `GEMINI_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_ACCESS_TOKEN`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VOICE_FROM`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`, `GOOGLE_MAPS_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, and `WHATSAPP_PHONE_NUMBER_ID`. Missing configuration fails closed or returns `configured: false`; demo UI data is not treated as a live provider result.

Before production activation, add Firebase Admin token verification and Firestore/FCM implementation behind the same trusted boundary, configure webhook signature verification for Razorpay, Stripe, Twilio/Exotel, and WhatsApp, add idempotency keys and audit writes for every outbound action, and obtain explicit voice/SMS/WhatsApp consent from the parent and family recipient.
