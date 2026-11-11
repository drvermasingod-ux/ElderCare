import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ActionButton, Card, StatusPill } from "@/components/care-ui";
import { isSignupRole, PHONE_AUTH_SMS_CONSENT_VERSION, SIGNUP_ROLES, type SignupRole } from "@/shared/firebase-auth";
import * as Api from "@/lib/_core/api";
import * as FirebaseAuth from "@/lib/firebase-auth";
import type { FirebaseIdentity, PhoneChallenge } from "@/lib/firebase-auth.types";
import { palette } from "@/lib/eldercare";

type AuthMode = "sign-in" | "sign-up";
type AuthMethod = "phone" | "email";
type AuthStep = "form" | "otp" | "verify-email" | "profile";

type Props = {
  initialMode: AuthMode;
  needsProfile: boolean;
  needsEmailVerification: boolean;
  sessionEmail: string | null;
  serverError: string | null;
  onClose: () => void;
  onRefresh: () => Promise<unknown>;
  onSignOut: () => Promise<void>;
};

function friendlyAuthError(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  if (code.includes("invalid-phone-number")) return "Enter a valid phone number with its country code, for example +91…";
  if (code.includes("invalid-verification-code")) return "That verification code is not correct. Check the SMS and try again.";
  if (code.includes("code-expired")) return "That code has expired. Request a new verification SMS.";
  if (code.includes("too-many-requests")) return "Too many attempts. Wait a while before requesting another code.";
  if (code.includes("operation-not-allowed")) return "This sign-in method is not enabled in the Firebase Console yet.";
  if (code.includes("email-already-in-use")) return "An account already uses this email. Choose Log in or reset its password.";
  if (code.includes("weak-password")) return "Choose a longer password that meets the Firebase password policy.";
  if (code.includes("invalid-credential") || code.includes("user-not-found") || code.includes("wrong-password")) return "The sign-in details could not be verified. Check them or use password reset.";
  if (code.includes("network-request-failed")) return "Could not reach Firebase. Check your connection and try again.";
  if (error instanceof Api.ApiError) return error.message;
  if (error instanceof Error && error.message.includes("Firebase app configuration")) return "This native build has no Firebase app file for this platform. Add the matching file to EAS and build a new app binary.";
  return "Secure sign-in could not be completed. Check Firebase setup and try again.";
}

export function FirebaseAuthPanel({
  initialMode,
  needsProfile,
  needsEmailVerification,
  sessionEmail,
  serverError,
  onClose,
  onRefresh,
  onSignOut,
}: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [step, setStep] = useState<AuthStep>("form");
  const [identity, setIdentity] = useState<FirebaseIdentity | null>(null);
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [code, setCode] = useState("");
  const [email, setEmail] = useState(sessionEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<SignupRole | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const firebaseConfigured = FirebaseAuth.isNativeAuthConfigured();
  const [serverAuthReady, setServerAuthReady] = useState<boolean | null>(null);
  const authBackendConfigured = firebaseConfigured && serverAuthReady === true;
  const platformSetupNotice = Platform.OS === "web"
    ? "Phone and Email/Password sign-in are available in configured native Android/iOS builds, not in the Expo web preview."
    : `This native ${Platform.OS} build has no Firebase app configuration. Add the matching ${Platform.OS === "ios" ? "GoogleService-Info.plist" : "google-services.json"} file to EAS and rebuild before sign-in can work.`;

  useEffect(() => {
    let active = true;
    void FirebaseAuth.getCurrentUser().then((user) => {
      if (active) setIdentity(user);
    }).catch(() => undefined);
    void Api.getFirebaseAuthBackendReady().then((ready) => {
      if (active) setServerAuthReady(ready);
    }).catch(() => {
      if (active) setServerAuthReady(false);
    });
    const unsubscribe = FirebaseAuth.onAuthStateChanged((user) => {
      if (active) setIdentity(user);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const activeStep = needsEmailVerification ? "verify-email" : needsProfile ? "profile" : step;
  const locked = needsProfile || needsEmailVerification || activeStep === "profile" || activeStep === "verify-email";
  const stepTitle = activeStep === "otp"
    ? "Enter your verification code"
    : activeStep === "verify-email"
      ? "Verify your email"
      : activeStep === "profile"
        ? "Set up your account"
        : mode === "sign-up" ? "Create your secure account" : "Welcome back";

  async function finishAuth() {
    const serverResult = await Api.getMe();
    if (serverResult.user) {
      await onRefresh();
      onClose();
      return;
    }
    if (serverResult.needsEmailVerification) {
      setStep("verify-email");
      setNotice("Verify the link sent to your email before choosing a care role.");
      return;
    }
    if (serverResult.needsProfile || identity) {
      await onRefresh();
      setStep("profile");
      return;
    }
    if (serverResult.error) throw new Api.ApiError(serverResult.error, 503);
  }

  async function requestPhoneCode() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const normalized = phone.trim().replace(/[\s()-]/g, "");
      if (!/^\+[1-9]\d{7,14}$/.test(normalized)) throw new Error("Enter a valid phone number with a + country code.");
      if (!smsConsent) throw new Error("Please consent to receive the sign-in SMS before requesting a code.");
      const nextChallenge = await FirebaseAuth.sendPhoneCode(normalized);
      setPhone(normalized);
      setChallenge(nextChallenge);
      setStep("otp");
      setNotice(`A Firebase verification SMS was requested for ${normalized}. If it does not arrive, check the Firebase SMS region policy and test-number setup.`);
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function confirmPhoneCode() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (!challenge) throw new Error("Request a new verification code first.");
      if (!/^\d{6}$/.test(code.trim())) throw new Error("Enter the six-digit code from Firebase.");
      const signedIn = await challenge.confirm(code.trim());
      setIdentity(signedIn);
      await finishAuth();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function submitEmail() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Enter a valid email address.");
      if (mode === "sign-up") {
        if (password.length < 8) throw new Error("Use a password with at least 8 characters.");
        if (password !== confirmPassword) throw new Error("The passwords do not match.");
        const created = await FirebaseAuth.createEmailAccount(normalizedEmail, password);
        setIdentity(created);
        setStep("verify-email");
        setNotice("Firebase sent a verification link. You must verify the email before a Parent/Child profile is created.");
      } else {
        const signedIn = await FirebaseAuth.signInWithEmail(normalizedEmail, password);
        setIdentity(signedIn);
        await finishAuth();
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function checkEmailVerification() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const refreshed = await FirebaseAuth.refreshCurrentUser();
      setIdentity(refreshed);
      if (!refreshed?.emailVerified) {
        setNotice("The email is not verified yet. Open the Firebase message, then check again.");
        return;
      }
      await finishAuth();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resendVerification() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      await FirebaseAuth.resendEmailVerification();
      setNotice("A new Firebase verification link was requested.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error("Enter your email address first.");
      await FirebaseAuth.sendPasswordReset(normalizedEmail);
      setPasswordResetSent(true);
      setNotice("If this address has an account, Firebase will send a password-reset message.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function createProfile() {
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (!selectedRole || !isSignupRole(selectedRole)) throw new Error("Choose Parent or Child/Family Member.");
      const cleanedName = displayName.trim();
      if (cleanedName.length < 2 || cleanedName.length > 80) throw new Error("Enter a name between 2 and 80 characters.");
      if (identity?.email && !identity.emailVerified) throw new Error("Verify your email before creating a care profile.");
      const phoneAccount = Boolean(identity?.phoneNumber);
      await Api.bootstrapFirebaseProfile({
        role: selectedRole,
        displayName: cleanedName,
        ...(phoneAccount ? { smsConsent: true, smsConsentVersion: PHONE_AUTH_SMS_CONSENT_VERSION } : {}),
      });
      const verified = await onRefresh();
      if (verified) onClose();
      else setError("Firebase accepted the account but the server has not confirmed a Parent/Child profile. Try again or contact support.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  async function signOutCurrent() {
    setBusy(true);
    await onSignOut();
    setIdentity(null);
    setChallenge(null);
    setCode("");
    setStep("form");
    setBusy(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Card style={styles.panel}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <StatusPill label="FIREBASE SIGN-IN" tone="neutral" />
            <Text style={styles.title}>{stepTitle}</Text>
            <Text style={styles.subtitle}>Your care role is created by ElderCare’s verified API after Firebase confirms this account.</Text>
          </View>
          <Pressable accessibilityLabel="Close secure sign-in" accessibilityRole="button" disabled={locked || busy} onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={22} color={palette.ink} />
          </Pressable>
        </View>

        {!firebaseConfigured ? (
          <View style={styles.configNotice}>
            <MaterialIcons name="construction" size={20} color={palette.terracotta} />
            <Text style={styles.noticeText}>{platformSetupNotice}</Text>
          </View>
        ) : null}

        {firebaseConfigured && serverAuthReady !== true ? (
          <View style={styles.configNotice}>
            <MaterialIcons name="cloud-off" size={20} color={palette.terracotta} />
            <View style={styles.backendNoticeCopy}>
              <Text style={styles.noticeText}>{serverAuthReady === null ? "Checking whether the live API has Firebase verification configured…" : "The API has not reported its Firebase verification adapter and server credentials as configured. Sign-in stays disabled to avoid creating a stranded account."}</Text>
              {serverAuthReady === false ? (
                <Pressable accessibilityRole="button" onPress={() => {
                  setServerAuthReady(null);
                  void Api.getFirebaseAuthBackendReady().then(setServerAuthReady).catch(() => setServerAuthReady(false));
                }} style={styles.textButton}>
                  <Text style={styles.textButtonText}>Check API setup again</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        {firebaseConfigured && serverAuthReady === true ? (
          <View style={styles.serverReadyNotice}>
            <MaterialIcons name="verified" size={18} color={palette.primaryDark} />
            <Text style={styles.helper}>The API reports Firebase verification credentials configured. This confirms configuration only, not a completed OTP/provider or care-data test.</Text>
          </View>
        ) : null}

        {serverError ? (
          <View style={styles.errorNotice}>
            <MaterialIcons name="cloud-off" size={19} color={palette.terracotta} />
            <Text style={styles.noticeText}>Server verification is unavailable: {serverError}</Text>
          </View>
        ) : null}

        {activeStep === "form" ? (
          <>
            <View style={styles.choiceRow} accessibilityRole="tablist">
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: method === "phone" }} onPress={() => { setMethod("phone"); setError(null); setNotice(null); }} style={[styles.choice, method === "phone" && styles.choiceSelected]}>
                <MaterialIcons name="phone-android" size={18} color={method === "phone" ? palette.white : palette.primaryDark} />
                <Text style={[styles.choiceText, method === "phone" && styles.choiceTextSelected]}>Phone OTP</Text>
              </Pressable>
              <Pressable accessibilityRole="tab" accessibilityState={{ selected: method === "email" }} onPress={() => { setMethod("email"); setError(null); setNotice(null); }} style={[styles.choice, method === "email" && styles.choiceSelected]}>
                <MaterialIcons name="email" size={18} color={method === "email" ? palette.white : palette.primaryDark} />
                <Text style={[styles.choiceText, method === "email" && styles.choiceTextSelected]}>Email</Text>
              </Pressable>
            </View>

            <View style={styles.modeRow}>
              <Pressable accessibilityRole="button" onPress={() => { setMode("sign-in"); setError(null); setNotice(null); }} style={[styles.modeButton, mode === "sign-in" && styles.modeButtonSelected]}>
                <Text style={[styles.modeText, mode === "sign-in" && styles.modeTextSelected]}>Log in</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => { setMode("sign-up"); setError(null); setNotice(null); }} style={[styles.modeButton, mode === "sign-up" && styles.modeButtonSelected]}>
                <Text style={[styles.modeText, mode === "sign-up" && styles.modeTextSelected]}>Create account</Text>
              </Pressable>
            </View>

            {method === "phone" ? (
              <>
                <Text style={styles.fieldLabel}>Mobile number</Text>
                <TextInput
                  accessibilityLabel="Mobile number with country code"
                  autoComplete="tel"
                  autoCapitalize="none"
                  keyboardType="phone-pad"
                  onChangeText={setPhone}
                  placeholder="+ country code and number"
                  placeholderTextColor={palette.muted}
                  style={styles.input}
                  value={phone}
                />
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: smsConsent }} onPress={() => setSmsConsent((current) => !current)} style={styles.consentRow}>
                  <MaterialIcons name={smsConsent ? "check-box" : "check-box-outline-blank"} size={22} color={smsConsent ? palette.primaryDark : palette.muted} />
                  <Text style={styles.consentText}>I consent to receive Firebase sign-in/verification SMS at this number. Carrier or SMS charges may apply. This does not send a care alert.</Text>
                </Pressable>
                <ActionButton disabled={busy || !authBackendConfigured || !smsConsent} icon="sms" onPress={() => void requestPhoneCode()}>
                  {busy ? "Requesting code…" : "Send verification code"}
                </ActionButton>
                <Text style={styles.helper}>Enter an E.164 number. SMS delivery depends on the Firebase project’s enabled provider, allowed regions, app verification and quota.</Text>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Email address</Text>
                <TextInput accessibilityLabel="Email address" autoComplete="email" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={palette.muted} style={styles.input} value={email} />
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput accessibilityLabel="Password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} onChangeText={setPassword} placeholder={mode === "sign-up" ? "At least 8 characters" : "Your password"} placeholderTextColor={palette.muted} secureTextEntry style={styles.input} value={password} />
                {mode === "sign-up" ? (
                  <>
                    <Text style={styles.fieldLabel}>Confirm password</Text>
                    <TextInput accessibilityLabel="Confirm password" autoComplete="new-password" onChangeText={setConfirmPassword} placeholder="Enter the password again" placeholderTextColor={palette.muted} secureTextEntry style={styles.input} value={confirmPassword} />
                    <Text style={styles.helper}>Email accounts must verify their address before a Parent/Child profile is created.</Text>
                  </>
                ) : null}
                <ActionButton disabled={busy || !authBackendConfigured} icon={mode === "sign-up" ? "person-add-alt-1" : "lock-outline"} onPress={() => void submitEmail()}>
                  {busy ? "Connecting…" : mode === "sign-up" ? "Create account" : "Log in"}
                </ActionButton>
                {mode === "sign-in" ? (
                  <Pressable accessibilityRole="button" disabled={busy} onPress={() => void resetPassword()} style={styles.textButton}>
                    <Text style={styles.textButtonText}>{passwordResetSent ? "Request another reset link" : "Forgot password?"}</Text>
                  </Pressable>
                ) : null}
              </>
            )}
          </>
        ) : null}

        {activeStep === "otp" ? (
          <>
            <View style={styles.otpSummary}>
              <MaterialIcons name="sms" size={22} color={palette.primaryDark} />
              <Text style={styles.otpText}>Enter the six-digit SMS code sent to {phone}. Firebase may apply SMS charges.</Text>
            </View>
            <Text style={styles.fieldLabel}>Verification code</Text>
            <TextInput accessibilityLabel="Six-digit SMS verification code" autoComplete="sms-otp" keyboardType="number-pad" maxLength={6} onChangeText={setCode} placeholder="6-digit code" placeholderTextColor={palette.muted} style={[styles.input, styles.codeInput]} value={code} />
            <ActionButton disabled={busy || !authBackendConfigured} icon="verified-user" onPress={() => void confirmPhoneCode()}>
              {busy ? "Verifying…" : "Verify and continue"}
            </ActionButton>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void requestPhoneCode()} style={styles.textButton}>
              <Text style={styles.textButtonText}>Send a new code</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setStep("form"); setCode(""); setError(null); }} style={styles.textButton}>
              <Text style={styles.textButtonText}>Change phone number</Text>
            </Pressable>
          </>
        ) : null}

        {activeStep === "verify-email" ? (
          <>
            <View style={styles.otpSummary}>
              <MaterialIcons name="mark-email-read" size={22} color={palette.primaryDark} />
              <Text style={styles.otpText}>Open the verification message sent to {identity?.email ?? sessionEmail ?? email}. Your care profile stays locked until Firebase reports the email as verified.</Text>
            </View>
            <ActionButton disabled={busy || !authBackendConfigured} icon="refresh" onPress={() => void checkEmailVerification()}>
              {busy ? "Checking…" : "I verified my email"}
            </ActionButton>
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => void resendVerification()} style={styles.textButton}>
              <Text style={styles.textButtonText}>Resend verification link</Text>
            </Pressable>
          </>
        ) : null}

        {activeStep === "profile" ? (
          <>
            <Text style={styles.profileIntro}>Choose the role for this new account. Only Parent and Child/Family Member can self-register. This choice cannot be changed here later; role alone never links or reveals another person’s care data.</Text>
            <Text style={styles.fieldLabel}>Your name</Text>
            <TextInput accessibilityLabel="Your name" autoComplete="name" onChangeText={setDisplayName} placeholder="Name shown to your care circle" placeholderTextColor={palette.muted} style={styles.input} value={displayName} />
            <Text style={styles.fieldLabel}>Account role</Text>
            <View style={styles.roleList}>
              {SIGNUP_ROLES.map((role) => (
                <Pressable key={role} accessibilityRole="radio" accessibilityState={{ selected: selectedRole === role }} onPress={() => setSelectedRole(role)} style={[styles.roleCard, selectedRole === role && styles.roleCardSelected]}>
                  <View style={styles.roleIcon}><MaterialIcons name={role === "parent" ? "elderly" : "family-restroom"} size={21} color={selectedRole === role ? palette.white : palette.primaryDark} /></View>
                  <View style={styles.roleCopy}>
                    <Text style={[styles.roleTitle, selectedRole === role && styles.roleTitleSelected]}>{role === "parent" ? "Parent" : "Child / Family Member"}</Text>
                    <Text style={[styles.roleDescription, selectedRole === role && styles.roleDescriptionSelected]}>{role === "parent" ? "Create a profile for your own care." : "Join a family circle after a separate invitation is verified."}</Text>
                  </View>
                  <MaterialIcons name={selectedRole === role ? "radio-button-checked" : "radio-button-unchecked"} size={21} color={selectedRole === role ? palette.white : palette.muted} />
                </Pressable>
              ))}
            </View>
            {identity?.phoneNumber ? (
              <View style={styles.consentSummary}>
                <MaterialIcons name="verified-user" size={18} color={palette.primaryDark} />
                <Text style={styles.helper}>You consented to receive this sign-in SMS. The server records the consent version when it creates your profile. Your phone number remains in Firebase Authentication.</Text>
              </View>
            ) : null}
            <ActionButton disabled={busy || !authBackendConfigured || !selectedRole || displayName.trim().length < 2} icon="check-circle" onPress={() => void createProfile()}>
              {busy ? "Creating verified profile…" : "Create Parent/Child profile"}
            </ActionButton>
          </>
        ) : null}

        {notice ? <View accessibilityLiveRegion="polite" style={styles.successNotice}><MaterialIcons name="info-outline" size={18} color={palette.primaryDark} /><Text style={styles.noticeText}>{notice}</Text></View> : null}
        {error ? <View accessibilityLiveRegion="polite" style={styles.errorNotice}><MaterialIcons name="error-outline" size={19} color={palette.terracotta} /><Text style={styles.noticeText}>{error}</Text></View> : null}

        {busy ? <ActivityIndicator accessibilityLabel="Authentication in progress" color={palette.primary} style={styles.busy} /> : null}
        {identity && activeStep !== "form" ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => void signOutCurrent()} style={styles.textButton}>
            <Text style={styles.textButtonText}>Sign out of {identity.email ?? identity.phoneNumber ?? "this account"}</Text>
          </Pressable>
        ) : null}
        {activeStep === "form" && method === "email" && mode === "sign-up" ? <Text style={styles.footerNote}>Open signup creates only a Parent or Child/Family Member account. Staff and Admin require a separate, server-approved process.</Text> : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 12 },
  panel: { alignSelf: "center", borderRadius: 25, gap: 13, maxWidth: 500, padding: 20, width: "100%" },
  header: { alignItems: "flex-start", flexDirection: "row", gap: 10, justifyContent: "space-between" },
  headerText: { flex: 1, gap: 8 },
  closeButton: { alignItems: "center", backgroundColor: palette.primaryWash, borderRadius: 22, height: 44, justifyContent: "center", width: 44 },
  title: { color: palette.ink, fontSize: 21, fontWeight: "900", lineHeight: 27 },
  subtitle: { color: palette.darkMuted, fontSize: 12, lineHeight: 18 },
  choiceRow: { backgroundColor: palette.primaryWash, borderRadius: 15, flexDirection: "row", gap: 6, padding: 5 },
  choice: { alignItems: "center", borderRadius: 12, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 44, paddingHorizontal: 8 },
  choiceSelected: { backgroundColor: palette.primary },
  choiceText: { color: palette.primaryDark, fontSize: 13, fontWeight: "800" },
  choiceTextSelected: { color: palette.white },
  modeRow: { borderBottomColor: palette.line, borderBottomWidth: 1, flexDirection: "row", gap: 14 },
  modeButton: { alignItems: "center", borderBottomColor: "transparent", borderBottomWidth: 3, justifyContent: "center", minHeight: 42, paddingHorizontal: 7 },
  modeButtonSelected: { borderBottomColor: palette.primary },
  modeText: { color: palette.muted, fontSize: 13, fontWeight: "700" },
  modeTextSelected: { color: palette.primaryDark, fontWeight: "900" },
  fieldLabel: { color: palette.darkMuted, fontSize: 12, fontWeight: "800", marginBottom: -7, marginTop: 1 },
  input: { backgroundColor: palette.white, borderColor: palette.line, borderRadius: 14, borderWidth: 1, color: palette.ink, fontSize: 15, minHeight: 50, paddingHorizontal: 14, paddingVertical: 11 },
  codeInput: { fontSize: 22, fontWeight: "800", letterSpacing: 8, textAlign: "center" },
  consentRow: { alignItems: "flex-start", flexDirection: "row", gap: 9, minHeight: 48, paddingVertical: 4 },
  consentText: { color: palette.darkMuted, flex: 1, fontSize: 12, lineHeight: 18 },
  helper: { color: palette.muted, flex: 1, fontSize: 11, lineHeight: 16 },
  textButton: { alignItems: "center", justifyContent: "center", minHeight: 44, paddingHorizontal: 8 },
  textButtonText: { color: palette.primaryDark, fontSize: 12, fontWeight: "800", textAlign: "center" },
  otpSummary: { alignItems: "flex-start", backgroundColor: palette.primaryWash, borderRadius: 15, flexDirection: "row", gap: 10, padding: 13 },
  otpText: { color: palette.darkMuted, flex: 1, fontSize: 12, lineHeight: 18 },
  profileIntro: { color: palette.darkMuted, fontSize: 12, lineHeight: 19 },
  roleList: { gap: 9 },
  roleCard: { alignItems: "center", backgroundColor: palette.white, borderColor: palette.line, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 76, padding: 12 },
  roleCardSelected: { backgroundColor: palette.primary, borderColor: palette.primary },
  roleIcon: { alignItems: "center", backgroundColor: palette.primaryWash, borderRadius: 20, height: 40, justifyContent: "center", width: 40 },
  roleCopy: { flex: 1, gap: 3 },
  roleTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  roleTitleSelected: { color: palette.white },
  roleDescription: { color: palette.darkMuted, fontSize: 11, lineHeight: 16 },
  roleDescriptionSelected: { color: "#E8FCFC" },
  consentSummary: { alignItems: "flex-start", flexDirection: "row", gap: 8, paddingHorizontal: 2 },
  backendNoticeCopy: { flex: 1, gap: 2 },
  configNotice: { alignItems: "flex-start", backgroundColor: "#FFF4E5", borderRadius: 14, flexDirection: "row", gap: 9, padding: 12 },
  serverReadyNotice: { alignItems: "flex-start", backgroundColor: palette.primaryWash, borderRadius: 14, flexDirection: "row", gap: 9, padding: 12 },
  errorNotice: { alignItems: "flex-start", backgroundColor: palette.terracottaWash, borderRadius: 14, flexDirection: "row", gap: 9, padding: 12 },
  successNotice: { alignItems: "flex-start", backgroundColor: palette.primaryWash, borderRadius: 14, flexDirection: "row", gap: 9, padding: 12 },
  noticeText: { color: palette.darkMuted, flex: 1, fontSize: 12, lineHeight: 18 },
  busy: { marginVertical: 2 },
  footerNote: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
});
