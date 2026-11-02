# ElderCare Companion — outcome checklist

## Mobile role entry and secure session shell

- [ ] Authenticate users with phone-number OTP through Firebase Authentication; after authentication retrieve the role from the trusted `users` record.
- [x] Provide a clear mobile entry state with client and staff role previews for the runnable demo; keep admin explicitly out of the mobile experience.
- [ ] Route client users only to the family dashboard, staff users only to the care-partner dashboard, and deny missing/invalid/suspended roles or profiles safely.
- [x] Include secure logout affordances in both role experiences and return to the login/entry state in the demo.
- [ ] Enforce the same role and ownership boundaries in Firestore Security Rules and trusted backend functions; never trust a role, user ID, assignment, payment status, or other privileged value from the client app.

## Multi-role onboarding and account linking

- [x] Provide one entry screen with separate Login and Sign-Up paths; Login offers Phone OTP, Email, and Social options in the demo UI.
- [x] During Sign-Up, require a role choice between Parent / Senior Citizen and Child / Family Member, and explain that role-based access is protected.
- [x] Support the child-first flow: collect parent name, phone number, and basic vitals, then offer Direct Integration, a 6-digit Pair Code app-install flow, or Keypad Phone Mode.
- [x] Support the parent-first flow: offer child mobile-number invite or a generated 6-digit Invite Code that the child can enter during sign-up.
- [x] Show completion states for linked family accounts, private code-sharing instructions, and keypad-phone AI voice reminder setup boundaries.
- [x] Provide a simplified Parent dashboard with large typography, a confirmation-based SOS action, connected-family status, and daily reminder logs; keep the Child dashboard comprehensive for vitals, services, visits, and alerts.
- [ ] Connect these demo states to Firebase Authentication, trusted role records, expiring one-time codes, SMS/WhatsApp delivery, consent records, and server-side account-linking transactions.

## Client and family mobile portal

- [x] Show a linked elderly-parent profile with name, photo treatment, health information, timestamps, and source labels; do not imply vitals are live.
- [x] Provide a prominent red SOS Emergency action with a confirmation step and visible alert status.
- [x] Provide a phone-only daily medication reminder control with notification permission handling, an 18:30 schedule, and a local “mark as taken” state; keep family-wide escalation reserved for the trusted backend workflow.
- [x] Show Today’s Tasks for medication reminders, scheduled visits, and completed/upcoming activities.
- [x] Offer service booking choices for doctor escort/hospital visits, daily companion visits, medication delivery, home lab collection, and transport assistance, with date, time, address, notes, and status scaffolding.
- [x] Show tracking/visit update states with last-updated timestamps and explicit consent/freshness language.
- [x] Provide a secure visit feed surface and a Digital Medical Vault surface for prescriptions, lab reports, and medical history, with access-controlled copy and upload affordances.
- [x] Show care plan/subscription status, support entry point, settings, and logout.

## Staff mobile portal

- [x] Show only assigned visits with elderly name, service address, scheduled time, and task status.
- [x] Include nearby/cluster language and an explicit 1 km radius note without exposing an unrelated client directory.
- [x] Provide a GPS check-in flow that communicates permission, 20 m proximity validation, accuracy, timestamp, and escalation states.
- [x] Provide a step-by-step active visit checklist for confirming the visit, recording blood pressure and blood sugar with time/units, capturing a photo/prescription subject to consent, adding notes, and submitting completion.
- [x] Prevent accidental duplicate completion in the demo UI and communicate backend assignment validation as required.
- [x] Show completed visits, earnings summary, profile, and secure logout.

## Backend and safety integration contract

- [ ] Define Firestore collections for users, elderlyProfiles, bookings, staffAssignments, visitRecords, locationUpdates, medicalDocuments, sosAlerts, reminders, subscriptions, transactions, payouts, leaveRequests, and auditLogs.
- [ ] Add strict Firestore and Storage rules for client-linked records, assigned staff records, and admin-only data; route role changes, assignment changes, SOS actions, and payment updates through trusted functions.
- [ ] Implement trusted flows for OTP role routing, booking creation, 20 m check-in validation, SOS alerts, medication reminder retries/escalation, dispatch/reassignment, audit logs, and logout/session cleanup.
- [ ] Integrate a voice provider such as Twilio for respectful medication reminders, response/outcome recording, three-attempt/15-minute escalation, duplicate prevention, quiet hours, invalid numbers, provider failures, and human/emergency-service disclaimers.
- [ ] Review privacy, consent, retention, localization, accessibility, and local regulatory requirements before launch; do not claim compliance without verification.

## Reliability and delivery

- [x] Include loading/empty/success/offline/permission-denied/error copy in the mobile shell where applicable.
- [ ] Add automated coverage for role isolation, security rules, geofence checks, alert retries, duplicate submissions, and logout.
- [x] Keep the app runnable on the fixed Expo/Metro 8081 and API 3000 runtime with no production secrets in source.
