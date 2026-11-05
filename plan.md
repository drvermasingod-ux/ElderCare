

## Part 2 mobile APK preparation

The Expo app remains a separate mobile deliverable from the static website. `eas.json` now defines an internal `preview` Android APK profile and a `production` Android App Bundle profile. The repository includes both an EAS build command and a local Gradle command, but the current Manus sandbox has no Android SDK/ADB; therefore no APK is claimed until an actual native build completes on EAS or an Android-enabled machine. Native install verification is required for notifications, secure storage, deep links, haptics, audio permissions, SOS confirmation, medication reminders, and account-linking behavior.
