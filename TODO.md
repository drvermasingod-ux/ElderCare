

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

- [x] Inspect the existing Expo, backend, Render, website and environment configuration. The earlier main deployment reported success, but on 11 Nov 2026 both bounded `/api/health` and `/api/integrations/status` probes timed out. Cloudflare Pages still responds with title `Vite App`, not this repository's `website/` build.
- [x] Prepare, validate and push the backend readiness/security follow-up: exact website CORS origins, owner-scoped media keys, generated-only legacy proxy, honest provider implementation status, and no fabricated reminder fallback. The current GitHub `main` contains those changes.
- [x] Owner confirmed Firebase Phone OTP plus Email/Password and open signup for Parent/Child roles; Firebase authentication is the mobile sign-in authority.
- [x] Implement native Firebase Phone OTP and Email/Password registration/sign-in, password reset, email-verification gating, Firebase error handling, SMS consent, and Firebase ID-token API requests. Do not retain Manus token fallback for Firebase mobile requests. Source implemented; native Firebase files and device tests remain pending.
- [x] Implement backend Firebase Admin ID-token verification and server-only initial Firestore user-profile bootstrap. Permit only initial `parent` or `child` signup; reject Admin/Staff, block disabled/unverified accounts, and keep family linking separate and unavailable until a consented server workflow is implemented.
- [x] Configure `@react-native-firebase/app` and `@react-native-firebase/auth` with conditional Expo config plugins and preserve the current Android/iOS package identifiers. A custom native build is required; actual EAS build/device validation remains pending.
- [x] Add native client Firebase app-file configuration paths; keep Firebase Admin variables server-only in Render. Firestore rules deny all client reads/writes by default. Configure files/credentials in Firebase/EAS/Render owner dashboards before enabling auth.
- [ ] Finish owner-controlled Firebase Console setup: enable Phone and Email/Password providers, set allowed SMS regions and abuse controls, confirm billing/SMS consent, register the app identifiers and SHA fingerprints, and provision Firestore in the chosen region. Do not ask the owner to paste keys into chat.
- [ ] Keep UI/API fail-closed until the configured Firebase project, server credentials and native config pass real tests; verify email signup, phone OTP, role creation, token rejection/acceptance, and account isolation on a native device. Source gates are implemented; providers/device have not been tested.
- [ ] Implement the persistent user/profile/elder/relationship data model and Firestore security rules. Users must not grant themselves roles or read unrelated families' information. Configure consent, audit events, account suspension, and data ownership.
- [ ] Implement parent-first and child-first linking with authenticated participants, phone ownership checks, consent, random one-time expiring server-stored invitation hashes, rate limits, single use, atomic relationship updates, and audit records; do not use fixed demo codes.
- [ ] Implement the core Parent, Child/Family Member, and Care Partner/Staff workflows: authorized care visibility, visits/bookings/assignments, medication schedules and outcomes, confirmed/idempotent SOS with recorded notification delivery, and a private medical vault. Every unavailable provider/operation must remain unavailable rather than returning a mock success.
- [ ] Secure private media: bind uploads/downloads to the authenticated owner, family relationship, or staff assignment; validate file category, size, content type, consent, retention and short-lived access; do not expose arbitrary storage keys through a public proxy.
- [x] Add a same-user R2 object-key guard for signed downloads and restrict the unauthenticated legacy storage proxy to flat generated image keys only; complete family relationship authorization, upload limits/content verification, consent and retention are still required.
- [x] Add exact HTTPS origin allowlisting for multiple Pages/custom website origins through `PUBLIC_APP_URLS`, rejecting malformed, unlisted and insecure remote origins.
- [x] Make `/api/integrations/status` report adapter implementation separately from environment-variable presence; Firebase token verification/profile bootstrap is implemented in source but never reported as production-ready solely from configured values. Return no fabricated reminder text when Gemini is absent.
- [ ] Implement server-enforced admin authorization and real admin endpoints before showing operational data. The static `/admin.html` notice is not an admin dashboard and must remain that way until verified sessions and authorization work.
- [ ] Implement payment state only from server-created catalog-priced orders and verified/idempotent provider webhooks; do not grant entitlements from client success. Enable voice, SMS, WhatsApp, AI and location features only after consent, provider callbacks, retries, monitoring and audit behavior exist.
- [ ] Publish real privacy, terms, support and contact information; confirm the legal entity/region, data controller/contact, retention, processors, languages and emergency disclaimer before making these pages final.
- [ ] Confirm a permanent website origin and app identifiers, supported launch roles/login methods/languages/region/currency, and whether Phase 1 includes staff, payments, and the admin dashboard. Treat the current `space.manus.eldercare.t263687757812581` Android/iOS identifiers as provisional until the owner approves them; changing identifiers later can require a new store app listing.
- [x] Use the approved Firebase Auth/Firestore architecture for mobile care identity; keep Manus OAuth/MySQL isolated as legacy and do not accept its token as a Firebase mobile session.
- [ ] Configure secrets only in their server/build provider secret managers, then run real API/auth/authorization checks. Build an EAS internal Android APK, install it on a physical phone and verify login, role routing, linking, permissions, storage, offline recovery, reminders and SOS before any public release.
- [ ] Correct Cloudflare Pages for `https://eldercare.pages.dev`: set the source to `drvermasingod-ux/ElderCare` on `main`, root `website`, build command `node build.mjs`, output `dist`, and public `VITE_API_URL`. The current URL instead serves a Vite app titled `Vite App`; verify the corrected live build before claiming the public landing page is deployed.

## User-provided mobile UI reference

- [x] Match the supplied mobile screenshot's ElderCare hand-heart brand mark and calm phone-sized layout: pale blue background, white rounded cards, navy headings, teal primary controls/status elements and a clear bottom navigation, while retaining readable type and touch targets.
- [x] Present the welcome/secure-access entry with separate Sign in and Create account affordances, but never show “Demo Mode (Mock Auth)” or create a session/account/send an OTP unless the real configured authentication provider confirms it. Until then explain the unavailable state without collecting phone numbers that cannot be used.
- [x] Add the protected elder/caregiver profile visual preview with read-only placeholders; it does not accept or persist sensitive data. A real authorized save flow remains blocked on care-domain API implementation.
- [ ] Enable elder/caregiver profile creation or editing only after verified authentication, consent and a real authorized save route; do not accept or locally persist sensitive profile/medical data as a visual demo.
- [x] Build a care overview with cards for care status, next medication, recent activity and linked profiles; show only server-authorized data, or truthful empty/unavailable states with no sample names, health values, statuses or recent events.
- [x] Provide a medication screen in the reference's Morning/Afternoon/Evening structure, but only show schedules loaded from the authorized API; do not mark a dose taken, create reminders or reschedule anything without a server/provider confirmation.
- [x] Provide health/SOS cards for heart rate, steps and location only when real device/provider permission and data are connected. Keep SOS unavailable until a real authorized alert endpoint exists; never imply an alert was sent and retain the local-emergency-services notice.
- [x] Provide a family/caregiver screen with an honest empty/unavailable state; generate an invitation only through the server's authenticated, consented, expiring single-use linking flow—never use example contacts or fixed invitation codes.
- [x] Keep visits and the medical vault as protected secondary app screens. Keep the Admin Portal and app-download/store/QR panels on the separate website; do not expose demo admin metrics or fake APK/store links inside the mobile app.

## Existing APK preparation outcomes

- [x] Preserve the existing Expo Router React Native mobile app separately from the website package and retain the ElderCare native branding.
- [x] Add an internal Android preview profile that produces an installable APK and a production profile that produces an Android App Bundle.
- [x] Add reproducible EAS preview and local Gradle build commands plus the native verification handoff.
- [ ] Run the first actual Android APK build on Expo EAS or a computer with Android SDK/ADB, then install it on a physical test phone.
- [ ] Verify native-only behavior on the installed APK: notifications, secure storage, deep links, haptics, audio permissions, SOS confirmation, medication reminders, and parent-child linking.

## Backend deployment — Render

- [x] Confirm the backend entrypoint is `pnpm build:server` followed by `pnpm start`, with `GET /api/health` available for a service health check.
- [x] Add a Render Free Blueprint with root repository settings, Node pinning, build/start commands, health check, and server-only Firebase Admin environment declarations.
- [x] Declare server-only Firebase Admin environment variables and exact-origin CORS variables in the Render Blueprint; retain legacy Manus/MySQL declarations only for separate legacy paths.
- [x] Make the Render build non-interactive by installing the pinned pnpm version explicitly and starting the compiled Node bundle directly.
- [ ] In Render, configure the Firebase service-account values and exact `PUBLIC_APP_URLS` origin; never share secret values in chat. Keep legacy Manus/MySQL values only if their separate path is still required.
- [ ] Restore/verify live Render health and integrations endpoints, then connect them to a Firebase-enabled Expo preview build and website. On 11 Nov 2026 both bounded live endpoint checks timed out; this remains open.
