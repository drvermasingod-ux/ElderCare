

## Immediate frontend remediation — user-requested scope

- [x] Remove or disable every direct/mock login and signup success path, hard-coded OTP/pair/invite codes, client-selected trusted role, local-only identity, and navigation that opens Parent/Child/Staff dashboards without a verified backend session and server-resolved role. A backend/auth failure must not fall back to demo access.
- [x] Replace demo/sample care records and success claims shown by the mobile frontend with API-backed data or explicit unavailable states; SOS, reminders, links, bookings, visits, uploads, and payments must never report a successful operation unless the backend/provider actually confirms it.
- [x] Configure all public frontend API requests to use `https://eldercare-api-vaee.onrender.com` by default and allow a build-time override (`VITE_API_URL` for the standalone website and `EXPO_PUBLIC_API_BASE_URL` for Expo). Do not expose server-only/provider credentials in either frontend.
- [x] Add a visible, non-sensitive API health state that checks `GET /api/health`, uses a graceful unavailable state on network/error/non-200 responses, and never infers Firebase readiness from API reachability.
- [x] Keep website `/admin.html` non-sensitive and unavailable until Firebase session verification and server-enforced admin-role endpoints exist; do not show demo metrics, a client-side password gate, fake sign-in, or direct admin dashboard access.
- [x] Keep app download links unavailable until an approved and validated APK/distribution URL is configured; remove alert-based fake download interactions.
- [x] Verify frontend TypeScript, lint, website build with API/download override smoke test, Expo web production export, and automated tests. Do not claim Firebase OTP, Firestore-backed care data, a live Render health check, Cloudflare Pages publication, or physical-device validation without real evidence.
- [x] Push the requested frontend remediation to `main` at `164908d8166d386f7030463b2670c07e2057dfc4`; GitHub reports the associated Render deployment succeeded. Cloudflare Pages publication is not confirmed.

## Go-live readiness audit and remaining launch outcomes

- [x] Inspect the existing Expo, backend, Render, website and environment configuration. Confirm the last GitHub commit, check the Render deployment record, attempt the Render health endpoint, and identify whether Cloudflare Pages or Firebase is verifiably live. The Render deployment record reports success, but the live `/api/health` request timed out; no Pages deployment was confirmed.
- [x] Prepare and validate local readiness/security follow-up: exact website CORS origins, owner-scoped media keys, generated-only legacy proxy, honest provider implementation status, no fabricated reminder fallback, TypeScript/lint/tests and production builds. These changes are not yet pushed.
- [ ] Push the additional backend readiness/security follow-up to `main` only after owner approval; the Render service has `autoDeploy: true`, so this will trigger a production API redeploy.
- [ ] Implement Firebase Authentication for the selected launch methods (phone OTP and, only if approved, email/password); verify Firebase ID tokens in the backend; resolve account status and trusted server-side roles before allowing any Parent, Child/Family, Care Partner/Staff, or Admin route.
- [ ] Implement the persistent user/profile/elder/relationship data model and Firestore security rules. Users must not grant themselves roles or read unrelated families' information. Configure consent, audit events, account suspension, and data ownership.
- [ ] Implement parent-first and child-first linking with authenticated participants, phone ownership checks, consent, random one-time expiring server-stored invitation hashes, rate limits, single use, atomic relationship updates, and audit records; do not use fixed demo codes.
- [ ] Implement the core Parent, Child/Family Member, and Care Partner/Staff workflows: authorized care visibility, visits/bookings/assignments, medication schedules and outcomes, confirmed/idempotent SOS with recorded notification delivery, and a private medical vault. Every unavailable provider/operation must remain unavailable rather than returning a mock success.
- [ ] Secure private media: bind uploads/downloads to the authenticated owner, family relationship, or staff assignment; validate file category, size, content type, consent, retention and short-lived access; do not expose arbitrary storage keys through a public proxy.
- [x] Add a same-user R2 object-key guard for signed downloads and restrict the unauthenticated legacy storage proxy to flat generated image keys only; complete family relationship authorization, upload limits/content verification, consent and retention are still required.
- [x] Add exact HTTPS origin allowlisting for multiple Pages/custom website origins through `PUBLIC_APP_URLS`, rejecting malformed, unlisted and insecure remote origins.
- [x] Make `/api/integrations/status` report adapter implementation separately from environment-variable presence, mark Firebase as not implemented and never production-ready, and return no fabricated reminder text when Gemini is absent.
- [ ] Implement server-enforced admin authorization and real admin endpoints before showing operational data. The static `/admin.html` notice is not an admin dashboard and must remain that way until verified sessions and authorization work.
- [ ] Implement payment state only from server-created catalog-priced orders and verified/idempotent provider webhooks; do not grant entitlements from client success. Enable voice, SMS, WhatsApp, AI and location features only after consent, provider callbacks, retries, monitoring and audit behavior exist.
- [ ] Publish real privacy, terms, support and contact information; confirm the legal entity/region, data controller/contact, retention, processors, languages and emergency disclaimer before making these pages final.
- [ ] Confirm a permanent website origin and app identifiers, supported launch roles/login methods/languages/region/currency, and whether Phase 1 includes staff, payments, and the admin dashboard. Treat the current `space.manus.eldercare.t263687757812581` Android/iOS identifiers as provisional until the owner approves them; changing identifiers later can require a new store app listing.
- [ ] Confirm whether the target Firebase Auth/Firestore architecture replaces the current Manus OAuth/MySQL user-table path. The Render Blueprint provisions only the API web service, not a MySQL database; do not create a paid database unless the owner chooses to retain that path.
- [ ] Configure secrets only in their server/build provider secret managers, then run real API/auth/authorization checks. Build an EAS internal Android APK, install it on a physical phone and verify login, role routing, linking, permissions, storage, offline recovery, reminders and SOS before any public release.
- [ ] Configure Cloudflare Pages and verify the actual `pages.dev` or custom domain. Set its root to `website`, build command `node build.mjs`, output `dist`, branch `main`, and only public `VITE_API_URL`/approved `PUBLIC_DOWNLOAD_URL` values. Set the exact allowed website origin in Render for CORS.

## Existing APK preparation outcomes

- [x] Preserve the existing Expo Router React Native mobile app separately from the website package and retain the ElderCare native branding.
- [x] Add an internal Android preview profile that produces an installable APK and a production profile that produces an Android App Bundle.
- [x] Add reproducible EAS preview and local Gradle build commands plus the native verification handoff.
- [ ] Run the first actual Android APK build on Expo EAS or a computer with Android SDK/ADB, then install it on a physical test phone.
- [ ] Verify native-only behavior on the installed APK: notifications, secure storage, deep links, haptics, audio permissions, SOS confirmation, medication reminders, and parent-child linking.

## Backend deployment — Render

- [x] Confirm the backend entrypoint is `pnpm build:server` followed by `pnpm start`, with `GET /api/health` available for a service health check.
- [x] Add a Render Free Blueprint with root repository settings, Node pinning, build/start commands, health check, and server-only environment declarations.
- [x] Declare the current Manus OAuth project/API endpoint environment variables in the Render Blueprint, while omitting Firebase Admin prompts until Firebase server code exists.
- [x] Make the Render build non-interactive by installing the pinned pnpm version explicitly and starting the compiled Node bundle directly.
- [ ] Verify `MANUS_PROJECT_ID`, `MANUS_OAUTH_API_URL`, `MANUS_JWT_SECRET`, `DATABASE_URL`, and the exact website origin in the existing Render service; add Firebase private credentials only after Firebase server code is implemented.
- [ ] Verify a real HTTP 200 from `/api/health` and connect the API URL to a Firebase-enabled Expo preview build and website. The latest check timed out, so this remains open.
