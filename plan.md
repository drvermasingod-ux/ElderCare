

## Immediate scope amendment — frontend demo removal and live API configuration

The user's latest request prioritizes correcting frontend behavior now: remove or block hard-coded/demo authentication and direct dashboard entry, configure public frontend requests to use the supplied Render URL (`https://eldercare-api-vaee.onrender.com`) with build-time overrides (`VITE_API_URL` for the standalone static website and `EXPO_PUBLIC_API_BASE_URL` for Expo), and push source changes to the repository's `main` branch. This is an immediate frontend slice of the larger production conversion below, not evidence that Firebase is live. In this checkout, phone OTP/Firebase client auth, server-side Firebase token verification, and Firestore care API routes are not implemented. The candidate Render endpoint timed out during two health checks from this environment, so UI must show backend unavailable when it cannot fetch health; it must not report working auth, Firebase or care records. Do not invent endpoints or successful auth responses. Dashboard routes must fail closed unless a current server response carries a trusted supported role; demo screens must not be reachable directly. Website download links remain unavailable until an approved validated artifact URL is supplied. Push to `main` is authorized by the user, but deployment success requires a real Cloudflare Pages build check separately.

## ElderCare Companion — Production Conversion Plan

### Current repository baseline

The selected repository is `drvermasingod-ux/ElderCare`, branch `main`, initially cloned at `3ff688fdf3c54cec4158983b436f42b1d0906575`. It contains an Expo SDK 57 / React Native 0.86 TypeScript app with Expo Router under `app/`, a root Express/tRPC TypeScript API under `server/`, Drizzle/MySQL user persistence under `drizzle/`, and a standalone static website under `website/`. `render.yaml` defines a Render API service, but this audit has not confirmed a deployed service or live health endpoint. There is no Cloudflare Pages deployment config in the repository.

Current authentication is a Manus OAuth session, not Firebase Authentication. Mobile onboarding, role selection, care data, SOS, bookings, staff visits, vault uploads, and reminders include hard-coded/local demo behavior. The backend exposes general integration adapters but has no Firebase Admin verification, Firestore care-domain routes, relationship/assignment authorization, webhooks, or domain audit model. Admin is a static public HTML shell with an alert. The download CTA is also an alert. Existing ElderCare assets and the hand-heart mark are preserved; mobile colors are being aligned to the user's pale-blue, teal, and deep-navy reference.

### Target architecture and decisions

1. **Standalone public website:** retain `website/` as a dedicated, static Cloudflare Pages site. Use `/` for the public landing page and a non-sensitive service-status/download/legal/support experience. Keep `admin.html` hidden or reduced to a safe unavailable/sign-in boundary until verified Firebase sessions and server-enforced admin authorization exist. No privileged code or secrets enter website output. The API URL and approved download/store URLs are public build-time configuration only.
2. **Separate Express API:** keep the existing root Express service as the separately deployed Render API; preserve `GET /api/health`, make startup/dependency status honest, bind to `process.env.PORT`, pin the Node/pnpm toolchain, and allow only explicitly configured website/local origins. Keep server-only secrets in Render encrypted environment values. A production API URL will not be hard-coded or claimed live until `/api/health` returns HTTP 200 from the deployed service.
3. **Firebase authority and primary application data:** adopt Firebase Authentication and Firestore as the single source of truth for user identity, trusted roles, care profiles, links, SOS, bookings, reminders, and audits; avoid parallel care state in MySQL. Replace Manus OAuth as the mobile care login authority rather than treating client role selectors or cached profile data as authorization. Backend routes verify Firebase ID tokens and resolve role/status/ownership from trusted records. Define Firestore rules and server-only Admin writes; test rules using emulators or an isolated development Firebase project before production.
4. **Mobile experience:** keep the existing Expo app separate from the website, retain its brand assets and distinct family/staff screen concepts, and resolve role only after authenticated server verification. Replace fixtures and fake-success handlers with real API-backed flows or explicit unavailable/error states. Configure only intentionally public Expo values (including `EXPO_PUBLIC_API_BASE_URL` and Firebase client configuration); never bundle Admin/provider secrets.
5. **Relationship, safety, and data flows:** implement one-time, random, expiring, hashed and single-use parent/child invitations with rate limiting, verified phone ownership, consent, Firestore transactions, and auditable relationship changes. SOS requires confirmation and linked-profile authorization, creates an idempotent record, reports only actual notification delivery, and always states that it is not a replacement for local emergency services. Implement role-scoped profiles, booking, visit, reminder, and private-file authorization before exposing data. R2 signing is short-lived and binds path/type/size/category to an authorized family/visit; medical downloads must check record ownership. Begin with on-device reminders; defer automated calls/escalation until consent, quiet-hours, retries, failure handling, provider webhooks, and monitoring are validated.
6. **Admin and providers:** admin remains unavailable until actual Firebase session and server admin-role checks are complete. Implement protected operational endpoints before wiring live metrics. Provider readiness indicates configured/disabled/pending only; non-empty environment values are not represented as tested integration health. Defer live payment entitlement, voice/SMS/WhatsApp, Gemini-generated content, GPS tracking, and advanced operational metrics until provider credentials, consent, signature-verified callbacks, idempotency, retries and operational monitoring are implemented and validated. No purchase, notification, upload, or emergency contact is reported as successful without a real service result.
7. **Deployment boundary:** keep Cloudflare Pages (static website), Render (Node API), Firebase (Auth/Firestore/FCM), private Cloudflare R2, and Expo/EAS builds separate. Render Free is for proof-of-concept/internal testing only and is not an urgent-alert production tier. Before public care use, require the appropriate non-sleeping service tier, privacy/security review, operational incident process, and physical-device verification. Deployment, Firebase setup, EAS build/distribution, GitHub push and real provider validation require the relevant account access/configuration and will not be claimed from source changes alone.

### Customization inventory

| Configurable item | Proposed control surface | Current status / guardrail |
|---|---|---|
| Application name and public copy | Central public website/mobile config | Brand currently ElderCare Companion; preserve unless changed by owner |
| Logo, icons and favicon | Existing image assets and Expo/site asset config | Existing ElderCare assets present; retain and document replacement points |
| Color palette and typography | Shared design tokens/site CSS and mobile theme | Mobile palette follows the supplied pale-blue/teal/navy reference; typography remains accessible and system-based |
| Primary and regional languages | Locale config and translated message resources | English UI is present; regional/voice language list needs owner/provider setup |
| Parent, child/family and staff role labels/views | Trusted role enum plus configurable copy; never client-assigned authority | Parent/Child/Staff/Admin requirements; existing UI uses `client`/`staff` demo routing |
| Elder profiles and health summaries | Firestore-owned profile records and typed forms | No live care profiles; collect only consented/necessary data |
| Care categories and booking service types | Server-validated allowlist/config | No production catalog; define launch list before enabling bookings |
| Medication/reminder schedules, quiet hours and time zone | Authenticated user/profile preferences, with local reminder support first | Current single demo 18:30 schedule is not a live care plan |
| Emergency contacts and escalation order | Consented profile configuration plus server delivery state | No real contact list or notification integration configured |
| Staff regions, assignments and permitted health fields | Admin-controlled configuration/assignment records | No trusted assignments; GPS/staff tracking deferred pending explicit consent and controls |
| Subscription plans and payment provider selection | Server-owned plan catalog/provider enablement | No live plans/payments; webhook verification and entitlement reconciliation required first |
| Support contacts/legal URLs | Public site config and approved policy pages | Real contact/policy destinations need owner-supplied values and review |
| APK/tester/store links | Public download URL setting | No validated APK/store destination; show not available until provided/tested |
| Website domain and API domain | Cloudflare/Render deployment config and public build variables | No permanent custom domain supplied; API URL must be externally health-checked before release builds |
| Provider enablement/readiness | Server-only environment and provider health/readiness registry | Credentials are not provisioned in this checkout; all integrations stay disabled/pending until tested |

### Repository structure and responsibilities

- `website/`: static public pages, safe admin entry, configurable API/download state, legal/support links, and assets; independently buildable for Cloudflare Pages.
- `app/`, `components/`, `constants/`, `hooks/`, `lib/`: Expo Router mobile journeys, role-specific presentation, authentication/session state, API client and app configuration; no server secrets or authoritative client role selection.
- `server/_core/`: Express startup, CORS, request IDs/log redaction, Firebase Admin token verification, role/consent/ownership middleware, health endpoint and shared request boundary.
- `server/routers/` or equivalent domain modules: account/profile, linking, SOS, reminders, bookings/visits, media authorization and role-protected admin API operations.
- `server/integrations/`: server-only provider adapters with explicit disabled/pending/available states, safe errors and delivery outcomes.
- `firebase/` (proposed): Firestore rules/indexes and emulator configuration; Firebase remains primary application data store.
- `docs/`: architecture, environment/deployment steps, schema/ownership, consent and provider activation procedures, honest deployment record.
- `tests/`: API auth/role/relationship isolation, single-use invitation and SOS idempotency, provider-disabled states, rules and frontend/API unavailable behavior.

### Delivery approach

Work incrementally against the repository's existing TypeScript style: establish environment/config and fail-closed API boundaries; remove client demo auth/fixtures and gate routes; introduce Firebase Auth/Firestore token verification and domain schemas/authorization; replace user-facing care actions with authorized API paths and honest unavailable states; add safe admin and public website/API/download/legal behavior; then validate builds/tests and deployment instructions. Do not activate a provider, publish a website, issue an APK, create production records, or claim an external integration without its actual configuration and a successful real test. Preserve the source brand while clearly distinguishing implemented code from externally unconfigured deployment work.

### Design direction

- **Design Movement:** apply the supplied reference's calm, modern care dashboard—airy light-blue backgrounds, white rounded cards, teal actions and clear phone-sized steps—while retaining ElderCare's existing hand-heart mark and deep navy.
- **Core Principles:** older-adult legibility; one-handed portrait use; visible care status; gentle but truthful microcopy; no health, family or emergency data invented for visual completeness.
- **Color Philosophy:** pale sky `#EAF6FC` softens the screen; white cards separate tasks; deep navy `#17324D` anchors trust; teal `#128F9D` signals primary actions; red is reserved for SOS-related warnings and never indicates a successful dispatch without a real confirmation.
- **Layout Paradigm:** a narrow, centered phone canvas on web with a vertically scrolling card stack; mobile bottom navigation leads to Home, Meds, SOS and Family, while Visits, Vault and Settings remain reachable as protected secondary screens.
- **Signature Elements:** the supplied ElderCare hand-heart logo, rounded metric/status cards, and small teal connection pills; show “not connected” or empty states instead of the reference's illustrative sample vitals, names, locations and medication values.
- **Interaction Philosophy:** large touch targets, clear consent and service-state explanations; login/signup affordances may show why secure sign-in is unavailable but may not create an account or send a pretend OTP; consequential care actions remain disabled until a real authorized API exists.
- **Animation:** short 150–200 ms fades/press feedback; respect reduced-motion settings; avoid animated pulses that could imply live health monitoring or SOS delivery.
- **Typography System:** use the existing system sans-serif for readable controls and body text, with navy semibold headings; preserve dynamic type and adequate line height.
- **Brand Essence:** calm, consent-led coordination for elders, family members and trusted care partners; personality: warm, dependable, respectful.
- **Brand Voice:** plain, gentle, specific, and candid about limits. Example: “Your care circle will appear after secure access is connected.” “No emergency alert has been sent; contact local emergency services if needed.”
- **Wordmark & Logo:** reuse the existing ElderCare Companion wordmark and supplied hand-heart mark; do not replace it with generated or default text branding.
- **Signature Brand Color:** teal `#128F9D` for clear primary controls, supported by deep navy `#17324D` and the existing restrained care palette.

### Screenshot-reference behavior boundary

The mobile implementation follows the reference's welcome → secure-access → care overview → medication → health/SOS → family flow. The reference's Admin Portal and APK/store download panels remain on the separate public website rather than being embedded as mobile admin capabilities. The source image's “Demo Mode (Mock Auth)”, example names, fake numbers, sample map/location and active SOS are visual-only content and must not be copied as app data or working actions. Until real auth and APIs are deployed, those areas display explicit unavailable states and disabled actions.

### Material external dependencies and limitations

The repository is pushed to `main` at `164908d8166d386f7030463b2670c07e2057dfc4`. GitHub reports the matching Render deployment as successful, but a fresh request to `https://eldercare-api-vaee.onrender.com/api/health` timed out after 25 seconds with no response; the live API is therefore not independently verified. No Cloudflare Pages deployment status or verified Pages hostname was found. Firebase client configuration, Firebase authentication/token verification, Firestore care-domain routes, and trusted Parent/Child/Staff roles are not implemented in the current source. No actual Firebase secrets, native Firebase configuration files, or Android/iOS release artifacts are present in the checkout. No physical-device testing was run. A repository build alone cannot prove production readiness, medical-data compliance, or emergency-delivery behavior.

### Existing native-build constraint

`eas.json` defines an internal `preview` Android APK profile and a `production` Android App Bundle profile. The repository includes EAS and local Gradle build commands, but the current sandbox has no Android SDK/ADB; therefore no APK is claimed until an actual native build completes on EAS or an Android-enabled machine. Native install verification is required for notifications, secure storage, deep links, haptics, audio permissions, SOS confirmation, medication reminders, and account-linking behavior.
