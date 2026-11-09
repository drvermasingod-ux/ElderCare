# Render backend deployment and current readiness

The Node.js/Express API is built from the repository root. Render runs the pinned pnpm install, `pnpm build:server`, starts `node dist/index.js`, and checks `GET /api/health`. The Render Blueprint describes infrastructure; it does not prove that the API is reachable or that app features are implemented.

## Render setup

1. In the Render Dashboard, choose **New → Blueprint** and connect `drvermasingod-ux/ElderCare` on branch `main`.
2. Use the root `render.yaml` and deploy the Blueprint.
3. Enter server-only values in Render's Environment screen, never in GitHub, Cloudflare Pages, Expo public variables, or chat.
4. After deployment completes, verify `https://eldercare-api-vaee.onrender.com/api/health` returns HTTP 200 and JSON containing `ok: true`. The health endpoint checks only API process reachability; it does not check the database or Firebase.

## Values used by the current API

The current API still uses Manus OAuth/session cookies. Verify these in Render:

```text
MANUS_PROJECT_ID
MANUS_OAUTH_API_URL
MANUS_JWT_SECRET
DATABASE_URL
PUBLIC_APP_URL
```

`DATABASE_URL` must point to the MySQL-compatible database used by the Drizzle schema. `PUBLIC_APP_URL` must be the canonical HTTPS website origin with no path or trailing slash. If both a `pages.dev` hostname and a custom domain must call the API, set `PUBLIC_APP_URLS` to comma-separated, exact HTTPS origins, for example `https://eldercare.pages.dev,https://care.example.com`. The API rejects unlisted origins; do not use wildcard CORS.

The Blueprint creates only the Render web service; it does not provision MySQL. If retaining the current Manus OAuth/user-table path, provision a supported external MySQL database and put its URL in Render. If the approved product path is a full Firebase Auth/Firestore replacement, implement and verify that migration before creating or paying for a new MySQL service; the old Manus OAuth/MySQL adapter can then be removed deliberately.

The Blueprint intentionally does not request Firebase Admin credentials yet. **The current API does not verify Firebase ID tokens or implement Firestore/FCM. Supplying `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` alone does not enable phone OTP, trusted roles, or care records.** Only add these after the corresponding implementation is in place and reviewed. Store the private key only in Render's secret environment field; if a single-line key is required, preserve the newline escapes expected by the server.

R2 values (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`) are server-only. Current signed-URL helpers are not a complete medical vault: file metadata, content/size verification, consent, family relationship sharing, retention, and deletion workflows remain unimplemented. The API status distinguishes configured envs from code implementation; do not treat `configured: true` as a production-readiness claim.

Optional built-in image generation uses `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY`; other optional adapter names are listed in `.env.example`. Leave provider credentials unset until that provider's full consented workflow, callback/webhook and failure handling are implemented.

## Current tier boundary

`render.yaml` currently specifies Render Free. Free services may sleep or restart and are not suitable for time-critical SOS or medication escalation. Do not depend on the current tier for emergency alert delivery. Store durable user/database/file data only in appropriately secured external services, never the Render filesystem.
