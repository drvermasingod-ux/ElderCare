import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, LogoMark, StatusPill } from "@/components/care-ui";
import { FirebaseAuthPanel } from "@/components/firebase-auth-panel";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { checkApiHealth, type ApiHealth } from "@/lib/api-health";
import { palette } from "@/lib/eldercare";

export default function EntryScreen() {
  const router = useRouter();
  const {
    user,
    loading,
    error,
    needsProfile,
    needsEmailVerification,
    sessionEmail,
    refresh,
    logout,
  } = useAuth();
  const [apiHealth, setApiHealth] = useState<ApiHealth>("checking");
  const [authPrompt, setAuthPrompt] = useState<"sign-in" | "sign-up" | null>(null);

  useEffect(() => {
    let active = true;
    checkApiHealth().then((available) => {
      if (active) setApiHealth(available ? "available" : "unavailable");
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && ["parent", "child", "staff"].includes(user?.role ?? "")) {
      router.replace("/(tabs)");
    }
  }, [loading, router, user?.role]);

  const requiredAuthPrompt = !loading && (needsProfile || needsEmailVerification) ? "sign-in" : null;
  const activeAuthPrompt = authPrompt ?? requiredAuthPrompt;

  const apiLabel = apiHealth === "checking"
    ? "Checking API connection"
    : apiHealth === "available"
      ? "API reachable · Firebase session checked separately"
      : "API is currently unavailable";

  return (
    <ScreenContainer containerClassName="bg-[#EAF6FC]" safeAreaClassName="bg-[#EAF6FC]">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.page}>
          <View style={styles.topLine}>
            <View style={styles.brandRow}>
              <LogoMark />
              <View>
                <Text style={styles.brand}>ElderCare</Text>
                <Text style={styles.brandSub}>COMPANION</Text>
              </View>
            </View>
            <StatusPill label="SECURE ACCESS" tone="neutral" />
          </View>

          <Card style={styles.heroCard}>
            <View style={styles.logoHalo}><LogoMark /></View>
            <Text style={styles.title}>Peace of mind, closer together.</Text>
            <Text style={styles.subtitle}>Thoughtful care coordination for older adults, the people they love, and trusted care partners.</Text>
            <View style={styles.buttonStack}>
              <ActionButton accessibilityLabel="Log in with Firebase Phone OTP or Email and Password" icon="lock-outline" onPress={() => setAuthPrompt("sign-in")}>Log in</ActionButton>
              <ActionButton accessibilityLabel="Create a Parent or Child account with Firebase" icon="person-add-alt-1" onPress={() => setAuthPrompt("sign-up")} variant="secondary">Create account</ActionButton>
            </View>
            <Text style={styles.secureCopy}>Firebase verifies your sign-in. ElderCare’s server assigns Parent or Child access.</Text>
          </Card>

          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              {apiHealth === "checking"
                ? <ActivityIndicator color={palette.primary} />
                : <MaterialIcons name={apiHealth === "available" ? "cloud-done" : "cloud-off"} size={21} color={apiHealth === "available" ? palette.primary : palette.terracotta} />}
              <Text style={styles.statusTitle}>Service status</Text>
            </View>
            <Text accessibilityLiveRegion="polite" style={styles.statusText}>{apiLabel}</Text>
            <Text style={styles.statusFootnote}>A reachable API does not mean Firebase or care workflows are configured.</Text>
          </Card>

          {error ? <Text accessibilityLiveRegion="polite" style={styles.authError}>{error.message}</Text> : null}

          {user ? (
            <Pressable accessibilityRole="button" onPress={() => void logout()} style={styles.signOut}>
              <MaterialIcons name="logout" size={17} color={palette.primaryDark} />
              <Text style={styles.signOutText}>Sign out of this session</Text>
            </Pressable>
          ) : null}

          <Text style={styles.emergencyText}>ElderCare Companion is not a replacement for local emergency services.</Text>
          <Pressable accessibilityRole="button" onPress={() => setAuthPrompt("sign-in")} style={styles.learnMore}>
            <Text style={styles.learnMoreText}>Secure sign-in options</Text>
            <MaterialIcons name="arrow-forward" size={16} color={palette.primaryDark} />
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        accessibilityViewIsModal
        animationType="fade"
        onRequestClose={() => {
          if (!requiredAuthPrompt) setAuthPrompt(null);
        }}
        transparent
        visible={activeAuthPrompt !== null}
      >
        <View style={styles.modalBackdrop}>
          {activeAuthPrompt ? (
            <FirebaseAuthPanel
              initialMode={activeAuthPrompt}
              needsProfile={needsProfile}
              needsEmailVerification={needsEmailVerification}
              sessionEmail={sessionEmail}
              serverError={error?.message ?? null}
              onClose={() => setAuthPrompt(null)}
              onRefresh={refresh}
              onSignOut={logout}
            />
          ) : null}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  page: { alignSelf: "center", gap: 15, maxWidth: 500, paddingBottom: 28, paddingHorizontal: 20, paddingTop: 18, width: "100%" },
  topLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 11 },
  brand: { color: palette.ink, fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  brandSub: { color: palette.primaryDark, fontSize: 9, fontWeight: "900", letterSpacing: 2, marginTop: 2 },
  heroCard: { alignItems: "center", borderRadius: 30, gap: 13, paddingHorizontal: 22, paddingVertical: 27 },
  logoHalo: { alignItems: "center", backgroundColor: palette.primaryWash, borderRadius: 32, height: 82, justifyContent: "center", width: 82 },
  title: { color: palette.ink, fontSize: 29, fontWeight: "900", letterSpacing: -0.8, lineHeight: 35, maxWidth: 370, textAlign: "center" },
  subtitle: { color: palette.inkSoft, fontSize: 14, lineHeight: 22, maxWidth: 360, textAlign: "center" },
  buttonStack: { gap: 11, marginTop: 7, width: "100%" },
  secureCopy: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 2, textAlign: "center" },
  statusCard: { gap: 8, padding: 15 },
  statusHeader: { alignItems: "center", flexDirection: "row", gap: 8 },
  statusTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  statusText: { color: palette.darkMuted, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  statusFootnote: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  authError: { color: palette.terracotta, fontSize: 12, lineHeight: 18, textAlign: "center" },
  signOut: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 7, minHeight: 44, paddingHorizontal: 10 },
  signOutText: { color: palette.primaryDark, fontSize: 13, fontWeight: "800" },
  emergencyText: { color: palette.muted, fontSize: 11, lineHeight: 16, textAlign: "center" },
  learnMore: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 5, minHeight: 44, paddingHorizontal: 10 },
  learnMoreText: { color: palette.primaryDark, fontSize: 12, fontWeight: "800" },
  modalBackdrop: { backgroundColor: "rgba(15, 39, 54, 0.55)", flex: 1, justifyContent: "center", padding: 14 },
});
