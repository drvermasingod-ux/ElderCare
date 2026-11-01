# ElderCare Companion — outcome checklist

## Mobile role entry and secure session shell

- [ ] Authenticate users with phone-number OTP through Firebase Authentication; after authentication retrieve the role from the trusted `users` record.
- [x] Provide a clear mobile entry state with client and staff role previews for the runnable demo; keep admin explicitly out of the mobile experience.
- [ ] Route client users only to the family dashboard, staff users only to the care-partner dashboard, and deny missing/invalid/suspended roles or profiles safely.
- [x] Include secure logout affordances in both role experiences and return to the login/entry state in the demo.
- [ ] Enforce the same role and ownership boundaries in Firestore Security Rules and trusted backend functions; never trust a role, user ID, assignment, payment status, or other privileged value from the client app.

## Client and family mobile portal

- [x] Show a linked elderly-parent profile with name, photo treatment, health information, timestamps, and source labels; do not imply vitals are live.
- [x] Provide a prominent red SOS Emergency action with a confirmation step and visible alert status.
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
