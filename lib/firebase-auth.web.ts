import type { FirebaseIdentity, PhoneChallenge } from "./firebase-auth.types";

function nativeOnly(): Error {
  return new Error("Secure sign-in is available in the configured ElderCare Android app, not on this public website.");
}

export function isNativeAuthConfigured(): boolean { return false; }
export async function getCurrentUser(): Promise<FirebaseIdentity | null> { return null; }
export function onAuthStateChanged(_listener: (user: FirebaseIdentity | null) => void): () => void { return () => undefined; }
export async function getIdToken(_forceRefresh = false): Promise<string | null> { return null; }
export async function sendPhoneCode(_phoneNumber: string): Promise<PhoneChallenge> { throw nativeOnly(); }
export async function signInWithEmail(_email: string, _password: string): Promise<FirebaseIdentity> { throw nativeOnly(); }
export async function createEmailAccount(_email: string, _password: string): Promise<FirebaseIdentity> { throw nativeOnly(); }
export async function resendEmailVerification(): Promise<void> { throw nativeOnly(); }
export async function refreshCurrentUser(): Promise<FirebaseIdentity | null> { throw nativeOnly(); }
export async function sendPasswordReset(_email: string): Promise<void> { throw nativeOnly(); }
export async function signOut(): Promise<void> { return undefined; }
