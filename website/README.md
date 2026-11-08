# ElderCare Companion Website

This package is intentionally separate from the Expo mobile app. It contains the public landing page at `/` and a non-sensitive unavailable notice at `/admin.html`; no admin session or operational data is implemented here.

## Cloudflare Pages settings

For a separate Pages project connected to this repository:

- Root directory: `website`
- Build command: `node build.mjs`
- Build output directory: `dist`
- Production branch: `main`
- Public build variable: `VITE_API_URL` (optional; defaults to the Render API origin in the public config)
- Optional public distribution variable: `PUBLIC_DOWNLOAD_URL` (leave unset until an approved, validated build URL exists)

Alternatively, from repository root use `pnpm build:website`; it produces `website/dist`. The build embeds only public URLs, never server credentials.

## Production boundary

The landing page fetches `GET /api/health` from the configured API and shows an honest unavailable state for network errors/non-200 results. API reachability does not prove Firebase readiness. No APK is offered unless an HTTPS `PUBLIC_DOWNLOAD_URL` is supplied. The admin page has no login, metrics, or data; implement Firebase authentication and server-side role checks before adding any operations UI. Never put credentials or admin controls in this static package.
