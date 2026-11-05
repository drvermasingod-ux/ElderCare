# ElderCare Companion Android APK build

## Current readiness

The Expo mobile app is configured for an internal preview APK in `eas.json`. The preview profile produces an installable `.apk`; the production profile produces an Android App Bundle for Play Store submission. The existing Android package identity and app branding in `app.config.ts` are preserved.

## EAS preview APK

From a computer with an Expo account and EAS CLI access:

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

Download the APK from the completed EAS build page, install it on a test Android phone, and verify the QR/device flows, parent-child linking, SOS confirmation, medication reminder permissions, and offline/error states.

Do not put Firebase, Gemini, R2, payment, Twilio, or other server secrets in the Expo bundle. Public API configuration belongs in `EXPO_PUBLIC_API_BASE_URL`; trusted provider keys stay on the backend.

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
