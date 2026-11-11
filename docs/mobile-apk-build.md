# ElderCare Companion Android APK build

## Current readiness

The Expo mobile app is configured for an internal preview APK in `eas.json`. The preview profile produces an installable `.apk`; the production profile produces an Android App Bundle for Play Store submission. The existing Android package identity and app branding in `app.config.ts` are preserved.

## EAS preview APK

Before building, link the project to the owner's Expo account and configure EAS. Firebase Phone OTP uses React Native Firebase native modules, so the custom native APK must include the matching Firebase app file; Expo Go and the Expo web export cannot validate Phone OTP. In EAS build variables, provide Android `google-services.json` as a file-type variable named `GOOGLE_SERVICES_JSON_FILE`. For iOS builds, use `GOOGLE_SERVICE_INFO_PLIST_FILE` with the matching `GoogleService-Info.plist`. Register the app IDs in Firebase and add EAS Android signing SHA-1/SHA-256 fingerprints.

```bash
npx eas-cli build:configure
pnpm build:apk:preview
```

After EAS reports a completed build, install the APK on a physical Android phone. First test Firebase fictional test-number OTP and email signup/verification, password reset, logout, invalid/expired token denial, Parent/Child-only self-signup, and unavailable API/config behavior. Do not claim family linking, care records, reminders, or SOS as working; those server workflows are not implemented yet.

Do not put Firebase Admin, Gemini, R2, payment, Twilio, or other server secrets in the Expo bundle. The Firebase client app file is a native build configuration, not an Admin credential. Public API configuration belongs in `EXPO_PUBLIC_API_BASE_URL`; trusted provider keys stay on the backend. Phone OTP also requires Firebase Phone provider setup, SMS region policy, approved SMS consent, and Android signing fingerprints.

## Local Gradle APK

A true local build requires Android Studio/SDK, platform tools, a JDK compatible with the Expo SDK, and Gradle. On that machine:

```bash
pnpm install --frozen-lockfile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

The resulting APK is under `android/app/build/outputs/apk/release/`. The generated `android/` folder is intentionally not created in the Manus sandbox because Android SDK/ADB are unavailable here and managed Mobile build guidance requires native release builds through the build handoff.

## Important boundary

Expo Web and Expo Go are not native APK verification. Notifications, deep links, secure storage, audio permissions, and native haptics still require an actual Android install.
