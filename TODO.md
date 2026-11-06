

## Part 2 — Mobile APK preparation

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
