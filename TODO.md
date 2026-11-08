

## Immediate frontend remediation — user-requested scope

- [x] Remove or disable every direct/mock login and signup success path, hard-coded OTP/pair/invite codes, client-selected trusted role, local-only identity, and navigation that opens Parent/Child/Staff dashboards without a verified backend session and server-resolved role. A backend/auth failure must not fall back to demo access.
- [x] Replace demo/sample care records and success claims shown by the mobile frontend with API-backed data or explicit unavailable states; SOS, reminders, links, bookings, visits, uploads, and payments must never report a successful operation unless the backend/provider actually confirms it.
- [x] Configure all public frontend API requests to use `https://eldercare-api-vaee.onrender.com` by default and allow a build-time override (`VITE_API_URL` for the standalone website and `EXPO_PUBLIC_API_BASE_URL` for Expo). Do not expose server-only/provider credentials in either frontend.
- [x] Add a visible, non-sensitive API health state that checks `GET /api/health`, uses a graceful unavailable state on network/error/non-200 responses, and never infers Firebase readiness from API reachability.
- [x] Keep website `/admin.html` non-sensitive and unavailable until Firebase session verification and server-enforced admin-role endpoints exist; do not show demo metrics, a client-side password gate, fake sign-in, or direct admin dashboard access.
- [x] Keep app download links unavailable until an approved and validated APK/distribution URL is configured; remove alert-based fake download interactions.
- [x] Verify frontend TypeScript, lint, website build with API/download override smoke test, Expo web production export, and automated tests. Do not claim Firebase OTP, Firestore-backed care data, a live Render health check, Cloudflare Pages publication, or physical-device validation without real evidence.
- [ ] Commit and push the completed source change to the selected repository's `main` branch as requested, and report its commit SHA. Report Pages publication only if the actual deployment completes successfully.

## Existing APK preparation outcomes

- [x] Preserve the existing Expo Router React Native mobile app separately from the website package and retain the ElderCare native branding.
- [x] Add an internal Android preview profile that produces an installable APK and a production profile that produces an Android App Bundle.
- [x] Add reproducible EAS preview and local Gradle build commands plus the native verification handoff.
- [ ] Run the first actual Android APK build on Expo EAS or a computer with Android SDK/ADB, then install it on a physical test phone.
- [ ] Verify native-only behavior on the installed APK: notifications, secure storage, deep links, haptics, audio permissions, SOS confirmation, medication reminders, and parent-child linking.

## Backend deployment — Render

- [x] Confirm the backend entrypoint is `pnpm build:server` followed by `pnpm start`, with `GET /api/health` available for a service health check.
- [x] Add a Render Free Blueprint with root repository settings, Node pinning, build/start commands, health check, and Firebase/R2 secret declarations.
- [x] Make the Render build non-interactive by installing the pinned pnpm version explicitly and starting the compiled Node bundle directly.
- [ ] Create the Render Blueprint from the connected GitHub repository and supply the Firebase Admin values without committing secrets.
- [ ] Verify the deployed `/api/health` response and connect the resulting API URL to the Expo preview build and website admin API.
