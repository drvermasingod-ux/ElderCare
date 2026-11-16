# ElderCare foreground location sharing

**Status:** Source implementation is in the current working copy. It is not yet deployed or device/emulator validated. Firebase Admin configuration, native builds, Firestore TTL cleanup, and a two-account security test remain prerequisites for launch.

## Scope and privacy contract

This first location feature is **foreground-only live sharing**. It does not use background location, an always-on permission, a foreground service, geofencing, a map provider, location alerts, or an SOS workflow. `expo-location`'s foreground `watchPositionAsync` is used while the user has opted in and the app is active. The watcher is removed when the app backgrounds; it may resume in the foreground only if the saved consent and OS permission are still active.

The user must check a separate in-app consent box before tapping **Share my live location**. The app then requests OS foreground permission and records a versioned consent in Firestore through the authenticated API. Enabling sharing snapshots the active Parent/Child family links in a Firestore transaction; only those existing counterpart accounts may read the live point. Family members do not need to enable their own sharing to see an owner's point. New family links do not gain access automatically. Enabling location sharing does not grant access to medical, medication, SOS, or other care records.

The server stores one latest point per consenting owner and overwrites it on update; it does not create a location-history collection. The location API hides points older than five minutes. The Firestore document includes an `expiresAt` field, but automatic TTL deletion is not enabled by this source change and may be delayed even after the owner enables it. Until cleanup is configured, the point remains server-side until overwritten or the owner revokes sharing. Stop-sharing increments the consent generation, disables the owner's location consent, and deletes the latest point in a transaction. Uploads tied to an older consent generation are rejected. If the device is offline during revocation, local updates stop, but the app cannot claim server deletion until a retry succeeds.

The app displays coordinates rather than a third-party map/address. A local device fix is distinguished from a point the server confirmed. Location payloads are not included in audit events; audit records contain consent changes only. Firestore client rules deny direct access to all collections.

## API contract

All requests require a Firebase ID-token `Authorization: Bearer` header and an active Parent or Child profile:

- `GET /api/location/sharing` — own sharing enabled state, current consent generation, and currently linked recipients still covered by the consent snapshot.
- `POST /api/location/sharing` — `{ "enabled": true, "consent": true, "consentVersion": "2026-11-16" }` to enable; `{ "enabled": false }` to revoke. The server stamps consent/audit time and snapshots the existing active relationship IDs only on enable.
- `POST /api/location/current` — finite bounded `{ "latitude", "longitude", "accuracyMeters", "generation" }`. The generation must match the server-issued active consent generation. The service validates the active profile and sharing status, then applies per-account rate limits.
- `GET /api/location/family` — returns only fresh current points for the caller's active, consent-authorized family relationships. It does not require the viewer to share their own location. It omits Firebase UIDs and relationship IDs.

The API rejects invalid coordinates, inactive accounts, disabled consent, old generations, stale/inactive relationship authorization, and excessive update rates. It returns no location on API failure; the mobile UI clears previously fetched family points on refresh failure.

## Configuration and launch steps

1. Configure Firebase Authentication and Firebase Admin as described in [FIREBASE-AUTH-SETUP.md](./FIREBASE-AUTH-SETUP.md); do not put Admin credentials in the mobile app.
2. Build a new native Android/iOS app with the `expo-location` config plugin. Only foreground location permission is configured. Expo Go is not sufficient for the app's React Native Firebase authentication; use an EAS native build.
3. Select the intended Firebase project in the Firebase CLI, then run `firebase deploy --only firestore` from the repository root. `firebase.json` points to the deny-by-default rules and `firebase/firestore.indexes.json` enables TTL on `latestLocations.expiresAt` and `locationRateLimits.expiresAt`. Confirm both field-level TTL policies appear enabled in that project. TTL is asynchronous; the API's five-minute freshness filter hides old points, but deletion is not immediate.
4. Keep `firebase/firestore.rules` deny-by-default. Only the Render Firebase Admin service writes sharing, audit, rate-limit, and latest-location documents.
5. Test with two controlled accounts in a Firebase Emulator or isolated non-production Firebase project: consent/deny, parent↔child reads, no own-consent requirement for viewing, future-link exclusion, wrong-role/unrelated-account denial, foreground/background transitions, stale filtering, request limits, revoke/queued-upload races, and server/API failure states. Then check location permission revocation and battery behavior on physical Android and iOS devices before launch.

Source code and route input validation do not prove Firebase rules, Admin writes, native permissions, or location delivery work in the configured production project. No production location-sharing readiness is claimed until those checks pass.
