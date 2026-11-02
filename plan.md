# ElderCare Companion — implementation plan

## Scope and approach

Build the mobile-first client and care-staff experience in the fixed Expo Router + React Native + TypeScript + NativeWind starter. The first vertical slice is a polished, runnable product shell using typed mock data and explicit backend seams: role-aware entry, client home, service booking, medical vault, visit feed, SOS confirmation/status, staff schedule, GPS check-in state, visit checklist, earnings/profile, and secure logout affordances. Firebase Authentication/Firestore/Storage/Cloud Functions/Twilio remain integration boundaries until project credentials and production rules are connected; UI copy never claims those integrations are live.

The app uses route-level role guards in the mobile client, with the corresponding trusted backend contract documented in `docs/backend-contract.md`. Privileged mutations (role routing, booking creation, SOS, check-in validation, task completion, medical-file access, and payment/subscription updates) are represented as server-owned operations rather than trusted client fields.

## Project structure

- `app/` — Expo Router screens, protected tabs, and role-specific navigation.
- `components/` — reusable cards, pills, modal confirmations, and icon-led actions.
- `constants/` — palette and typography tokens.
- `lib/` — mock domain data, role/session state, and shared formatting helpers.
- `docs/backend-contract.md` — Firebase collections, rules strategy, Cloud Function flows, integrations, privacy, and testing notes.
- `plan.md` / `TODO.md` — implementation decisions and acceptance outcomes.

## Design direction

### Three candidate styles

- Quiet Heritage Care (0.07): editorial ivory paper, indigo ink, terracotta signal red, and heirloom-inspired corner ornaments.
- Clinical Sunrise (0.06): bright whites, teal, and precise medical dashboard geometry.
- Soft Modern Utility (0.05): pale blue-gray surfaces, cool green, and compact productivity patterns.

### Chosen movement: Quiet Heritage Care

The product should feel dependable and human rather than clinical or alarmist. Core principles: calm hierarchy, large one-handed touch targets, status before decoration, and warmth without losing operational clarity. The ivory background (#F7F2EA) carries the feeling of a kept family notebook; deep indigo (#17324D) anchors trust and contrast; terracotta (#D4513D) reserves urgency for SOS; muted sage (#8FA68D) signals healthy progress.

The layout is a vertical “care journal”: a quiet greeting and parent profile lead into a single clear next action, followed by stacked timeline cards instead of a dense dashboard grid. Signature elements are thin indigo rule lines, small ornamental corner marks, and terracotta circular action badges. Interactions use brief opacity/scale feedback only; critical actions require confirmation. Typography pairs a strong serif-like display treatment for care moments with readable system sans for data, controls, and timestamps. Voice is warm and direct: “A steady hand for the people you love.” and “Measured at 09:12 · source: staff visit.”

Brand essence: a family’s calm operational companion for ageing at home — reassuring, precise, human. Personality: attentive, grounded, protective. Wordmark concept: a small indigo “window + leaf” mark beside ElderCare, representing a home watched over from near or far. Signature brand color: deep indigo ink.

## Build workflow

1. Implement the client/staff mobile shell with mock data and accessible states.
2. Run TypeScript diagnostics and the starter checks.
3. Start Metro/API on the fixed 8081/3000 ports and verify preview readiness.
4. Inspect the mobile UI at a portrait viewport and fix any concrete defects.
5. Commit the runnable implementation and documentation to the managed canonical repository.

## Known boundaries

Firebase phone OTP, role retrieval, strict Firestore/Storage rules, trusted geofence validation, Twilio outbound reminders, real maps, uploads, payment tokenization, and admin web routes are documented integration requirements, not falsely represented as active in this demo slice. Emergency automation must never replace local emergency services or human care.

## Onboarding extension

The entry route now acts as a guided state machine rather than a direct role preview. It separates Login from Sign-Up, offers phone OTP/email/social method choices, collects a role choice during sign-up, and routes child-first versus parent-first linking into explicit screens. Child-first onboarding captures the parent profile and offers direct verified-number matching, a 6-digit Pair Code app flow, or keypad-phone mode. Parent-first onboarding offers a child-mobile invite or a 6-digit Invite Code. These are UI/demo states only until Firebase Auth, expiring server-issued codes, SMS/WhatsApp delivery, consent records, and atomic linking transactions are connected.

The child/family dashboard remains the comprehensive care-operations view. A new parent persona uses large type, a prominent confirmation-based SOS, a connected-family banner, and a short daily reminder log; parent-only navigation hides visits and the medical vault in the tab shell. The selected visual movement remains Quiet Heritage Care: the parent experience uses the same ivory paper, indigo ink, sage trust signal, and terracotta urgency color, with fewer choices and larger touch targets.
