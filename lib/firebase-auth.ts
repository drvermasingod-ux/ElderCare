// Resolver fallback for tools without platform suffix support. Expo Metro uses
// firebase-auth.native.ts on devices and firebase-auth.web.ts in web exports.
export * from "./firebase-auth.web";
