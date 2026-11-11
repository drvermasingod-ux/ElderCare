# Render backend deployment and current readiness

The Node.js/Express API builds from the repository root. Render runs the pinned pnpm install, `pnpm build:server`, starts `node dist/index.js`, and checks `GET /api/health`. A successful build or health endpoint proves neither Firebase auth nor care workflows are live.

## Render setup

1. In Render Dashboard, connect `drvermasingod-ux/ElderCare` on `main` and apply the root `render.yaml` Blueprint.
2. Keep server credentials in the Render service's Environment settings only. Do not put them in Cloudflare Pages, Expo public variables, GitHub, or chat.
3. After deploy, verify `https://eldercare-api-vaee.onrender.com/api/health` returns HTTP 200 with `{ "ok": true }`. This health endpoint checks process reachability only, not Firebase or Firestore.

## Values for Firebase mobile authentication

The current mobile auth API accepts Firebase ID tokens, verifies them with Firebase Admin, and reads Parent/Child roles from server-owned Firestore profiles. The API supports initial profile bootstrap only; care records, linking, SOS, reminders, FCM, and admin workflows are not implemented. Set these values in Render:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
PUBLIC_APP_URLS
```

Set `PUBLIC_APP_URLS` to the exact HTTPS website origin `https://eldercare.pages.dev` (add only approved additional origins). Do not use a wildcard, path, or trailing slash. Keep the Firebase service-account private key server-only; if entered as one line, preserve the newline escapes required by the server. A present environment value is a configuration indicator, not proof of Firebase connectivity or successful sign-in.

The Blueprint declares these Firebase values but does not create a Firestore database. The app remains fail-closed until both native client configuration and server auth configuration are available.

## Legacy and optional services

The Manus OAuth/MySQL adapter remains in the repository as legacy code and is not a fallback token for Firebase mobile requests. `MANUS_PROJECT_ID`, `MANUS_OAUTH_API_URL`, `MANUS_JWT_SECRET`, and `DATABASE_URL` may still be needed by legacy website/OAuth paths; the Render Blueprint does not provision MySQL. Avoid provisioning a new database without confirming whether that legacy path is still required.

R2 values (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`) are server-only. Signed URL helpers are not a complete medical vault: relationship sharing, file metadata, content/size verification, consent, retention, and deletion workflows remain unimplemented. Other provider credentials should remain unset until their full consented workflows and delivery/failure handling are available.

## Current live status

On 11 November 2026, bounded requests to both `/api/health` and `/api/integrations/status` timed out after 20 seconds from the current environment. The cause is not established. Check Render service events/logs and verify the endpoints before relying on the deployment. `render.yaml` has `autoDeploy: true`, so pushing to `main` triggers a Render deployment.

## Hosting tier boundary

`render.yaml` currently specifies Render Free. Free services may sleep or restart and are not suitable for time-critical SOS or medication escalation. Do not depend on the current tier for emergency alert delivery. Store durable data only in secured external services, never on the Render filesystem.
