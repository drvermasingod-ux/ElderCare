# Render backend deployment

The backend is a Node.js/Express service in the repository root. Render installs the pinned pnpm version non-interactively, runs `pnpm install --frozen-lockfile` and `pnpm build:server`, starts the compiled bundle with `node dist/index.js`, and uses `GET /api/health` as its health check. `render.yaml` defines a Free web service named `eldercare-api` and prompts for secrets instead of committing their values.

## Render setup

1. In Render Dashboard, choose **New → Blueprint** and connect `drvermasingod-ux/ElderCare` on branch `main`.
2. Use the root `render.yaml` and deploy the Blueprint.
3. Supply the prompted secrets in Render, never in GitHub.
4. After the build completes, verify `https://<service>.onrender.com/api/health` returns JSON with `ok: true`.

Required values are:

```text
MANUS_JWT_SECRET
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
PUBLIC_APP_URL
```

`DATABASE_URL` and the R2 values are declared for the current server contract. They may remain unset only while database/media procedures are not used; production feature activation should configure them before those routes are enabled.

`FIREBASE_PRIVATE_KEY` must be pasted into Render as the complete service-account private key. If entered as a single line, preserve the `\\n` escapes expected by the server. Do not paste this key into Expo, Cloudflare Pages, GitHub, chat, or screenshots.

## Free-tier boundary

Render Free web services are suitable for testing, not production: they spin down after 15 minutes without traffic, restart on the platform's schedule, use ephemeral local storage, and have monthly included usage limits. Persistent user data must stay in Firestore/R2 rather than the service filesystem. See Render's current [free service limitations](https://render.com/docs/free).
