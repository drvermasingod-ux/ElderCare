# ElderCare Companion Website

This package is intentionally separate from the Expo mobile app. It contains the public landing page at `/` and a no-index admin-console shell at `/admin.html`.

## Cloudflare Pages settings

For a separate Pages project connected to this repository:

- Root directory: `website`
- Build command: `true`
- Build output directory: `.`
- Production branch: `main`

Alternatively, from repository root use `npm run build:website` and set output directory to `website-dist`.

## Production boundary

The landing page is static and does not claim that an APK or app-store listing is available until those links are supplied. The admin page is a visual shell only: it must be protected by Firebase Admin authentication and a server-side API before displaying downloads, payment failures, support tickets, or user data. Never put admin credentials in this static package.
