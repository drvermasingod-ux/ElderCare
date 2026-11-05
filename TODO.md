

## Separate Website — landing page and admin shell

- [x] Keep the website separate from the Expo mobile app under `website/`, with its own landing page, assets, styles, and route manifest.
- [x] Provide a professional landing page that explains ElderCare Companion, shows the safety model, and includes a clear Download App / Get APK and future Google Play / App Store CTA area without inventing unavailable store links.
- [x] Provide a no-index admin-console shell with a protected-sign-in boundary and empty states for app downloads, payment failures, and support issues; do not expose live user or payment data in static HTML.
- [ ] Connect the admin console to Firebase Admin-authenticated API routes, download analytics, payment webhooks, support records, and audit logs before showing production data.
- [ ] Create a separate Cloudflare Pages project for `website/` and verify its production URL, custom domain, privacy pages, and final APK/store links.
