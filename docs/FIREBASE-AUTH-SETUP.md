# ElderCare Firebase Auth setup and owner handoff

**Source status (11 Nov 2026):** Native client Phone OTP and Email/Password flows, Firebase Admin ID-token verification, server-side Parent/Child profile bootstrap, and deny-by-default Firestore client rules are implemented in the working copy. TypeScript, lint, 67 automated tests, API/Expo/website builds and Expo dependency checks passed. This is not live-auth proof: the changes are uncommitted, native Firebase app files/EAS link are absent, Render currently times out from this environment, and no physical-device or real-provider test has been completed.

## Confirmed sign-in behavior

- Mobile native sign-in supports Firebase Phone OTP and Email/Password. Email/password signup must verify the address before a server profile is accepted.
- Open signup offers only `parent` or `child` roles. Admin/Staff cannot self-register. The API verifies Firebase ID tokens with Firebase Admin and resolves roles from server-owned Firestore profiles; a client role choice never grants access to another person's data.
- Phone auth requires SMS consent in the app. Firebase Phone OTP needs a custom native build; Expo Go and the Expo web preview are not supported auth test environments.
- Firebase app/config not present, server credentials not ready, rejected token, or unavailable API all keep secure access blocked. Do not use Manus OAuth as a Firebase fallback.
- Firestore client rules deny reads and writes. Only initial user profiles are implemented; family linking, care records, SOS, reminders, private vault, staff/admin operations and audit workflows are not yet available.

## Firebase Console actions

1. Open **Authentication → Sign-in method** and enable **Phone** and **Email/Password**. Choose the password policy and email-enumeration settings before public signup.
2. Open **Authentication → Settings → SMS region policy** and allow only intended countries. Review SMS quota/billing and the app's notice that Firebase sends the number to Google for verification/abuse prevention. Test with Firebase fictional test numbers first.
3. Confirm the provisional Android/iOS identifier `space.manus.eldercare.t263687757812581` before registering it. For Android, register the Firebase app and add the EAS signing SHA-1 and SHA-256 fingerprints. For iOS, register the matching bundle ID if iOS is in launch scope.
4. Download `google-services.json` for Android. If iOS is included, download `GoogleService-Info.plist`. Do not put either file in chat or a public Git repository.
5. Create/confirm Firestore in the intended region. Keep `firebase/firestore.rules` deny-by-default until specific client-read workflows have been designed and tested.

## Render — server-only credentials and origin

In Render Dashboard → **eldercare-api → Environment**, set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` from the Firebase service account, plus `PUBLIC_APP_URLS=https://eldercare.pages.dev` (add any approved website origins as exact HTTPS origins). Do not share the private key in chat, Cloudflare Pages, Expo public variables, or GitHub. A populated secret only satisfies a configuration gate; it does not prove Firestore access, provider health, or working sign-in.

The latest bounded live check from this session timed out on both `/api/health` and `/api/integrations/status`. Review Render service events/logs and restore a working endpoint before treating the public API as ready.

## Expo/EAS — native configuration and APK

Link the Expo project with the owner's Expo account and `eas build:configure`. In EAS build environment variables, add the Android service file as a **file-type** variable named `GOOGLE_SERVICES_JSON_FILE`. For iOS, add a file-type `GOOGLE_SERVICE_INFO_PLIST_FILE`. Configure the public API base as `EXPO_PUBLIC_API_BASE_URL=https://eldercare-api-vaee.onrender.com`. Never set the Firebase Admin service-account key in Expo.

After Firebase and API settings are in place, run from the repository root:

```sh
pnpm build:apk:preview
```

Install the completed APK on a physical Android device. Verify Firebase test-number OTP, a controlled real-number OTP only after SMS policy/billing approval, email signup and verification, password reset, logout, invalid/expired token rejection, API-unavailable behavior, and that Admin/Staff cannot self-register. A build artifact or successful Firebase sign-in alone is not evidence that care workflows are implemented.

## Cloudflare Pages remains separate

Configure Cloudflare Pages to use `drvermasingod-ux/ElderCare`, branch `main`, root directory `website`, build command `node build.mjs`, output directory `dist`, and public `VITE_API_URL=https://eldercare-api-vaee.onrender.com`. The current `https://eldercare.pages.dev/` response still has title `Vite App`, so verify the corrected site output after changing Pages settings. Keep `PUBLIC_DOWNLOAD_URL` blank until a validated APK distribution URL exists. Never add Firebase Admin or other provider secrets to Pages.

## Official references

- [Expo — Using Firebase](https://docs.expo.dev/guides/using-firebase/)
- [React Native Firebase — Phone Authentication](https://rnfirebase.io/auth/phone-auth)
- [React Native Firebase — Authentication usage](https://rnfirebase.io/auth/usage)
- [Firebase — Android Phone Auth](https://firebase.google.com/docs/auth/android/phone-auth)
- [Firebase Admin — Verify ID tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Firebase — Password-based accounts](https://firebase.google.com/docs/auth/web/password-auth)
