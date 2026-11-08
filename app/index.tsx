import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Card, Eyebrow, LogoMark } from "@/components/care-ui";
import { checkApiHealth, type ApiHealth } from "@/lib/api-health";
import { useAuth } from "@/hooks/use-auth";
import { palette } from "@/lib/eldercare";

export default function EntryScreen() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [apiHealth, setApiHealth] = useState<ApiHealth>("checking");

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

  const apiLabel = apiHealth === "checking"
    ? "Checking API connection…"
    : apiHealth === "available"
      ? "API reachable. This does not confirm Firebase authentication is enabled."
      : "Service temporarily unavailable. The API health check did not succeed.";

  return (
    <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}>
          <LogoMark />
          <View><Text style={styles.brandName}>ElderCare</Text><Text style={styles.brandSub}>Companion</Text></View>
        </View>
        <View style={styles.heroRule} />
        <Eyebrow>Care feels closer</Eyebrow>
        <Text style={styles.title}>Your care circle starts with verified access.</Text>
        <Text style={styles.intro}>Parent, family and care-partner records stay locked until the service verifies your sign-in and trusted role.</Text>

        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {apiHealth === "checking" ? <ActivityIndicator color={palette.terracotta} /> : <MaterialIcons name={apiHealth === "available" ? "cloud-done" : "cloud-off"} size={22} color={apiHealth === "available" ? palette.sage : palette.terracotta} />}
            <Text style={styles.statusTitle}>Backend status</Text>
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.statusText}>{apiLabel}</Text>
          <Text style={styles.authText}>Phone OTP / Firebase sign-in is not implemented by the current API contract. No account has been created and no dashboard has been opened.</Text>
        </Card>

        <View style={styles.lockedNotice}>
          <MaterialIcons name="lock-outline" size={20} color={palette.ink} />
          <Text style={styles.lockedText}>Sign-in and account creation are unavailable until real Firebase phone verification and server-side role checks are configured. This screen will not simulate an OTP or successful login.</Text>
        </View>
        {user ? <Pressable accessibilityRole="button" onPress={() => void logout()} style={styles.signOut}>
          <MaterialIcons name="logout" size={17} color={palette.terracotta} />
          <Text style={styles.signOutText}>Sign out of this session</Text>
        </Pressable> : null}
        <View style={styles.emergencyNotice}>
          <Text style={styles.emergencyText}>ElderCare Companion is not a replacement for local emergency services.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 44 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 11, marginBottom: 26 },
  brandName: { color: palette.ink, fontFamily: "serif", fontSize: 25, fontWeight: "700", letterSpacing: -0.3 },
  brandSub: { color: palette.terracotta, fontSize: 10, fontWeight: "800", letterSpacing: 2.2, textTransform: "uppercase" },
  heroRule: { backgroundColor: palette.ink, height: 2, marginBottom: 24, opacity: 0.9, width: 42 },
  title: { color: palette.ink, fontFamily: "serif", fontSize: 35, fontWeight: "700", letterSpacing: -0.6, lineHeight: 42, marginTop: 9 },
  intro: { color: palette.inkSoft, fontSize: 15, lineHeight: 23, marginTop: 13 },
  statusCard: { gap: 11, marginTop: 25 },
  statusHeader: { alignItems: "center", flexDirection: "row", gap: 9 },
  statusTitle: { color: palette.ink, fontSize: 15, fontWeight: "800" },
  statusText: { color: palette.darkMuted, fontSize: 13, lineHeight: 19 },
  authText: { borderTopColor: palette.line, borderTopWidth: 1, color: palette.darkMuted, fontSize: 12, lineHeight: 18, paddingTop: 10 },
  lockedNotice: { alignItems: "flex-start", backgroundColor: palette.sageWash, borderRadius: 15, flexDirection: "row", gap: 10, marginTop: 16, padding: 14 },
  lockedText: { color: palette.darkMuted, flex: 1, fontSize: 12, lineHeight: 19 },
  signOut: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 7, marginTop: 18, paddingVertical: 10 },
  signOutText: { color: palette.terracotta, fontSize: 13, fontWeight: "800" },
  emergencyNotice: { borderTopColor: palette.line, borderTopWidth: 1, marginTop: 26, paddingTop: 15 },
  emergencyText: { color: palette.muted, fontSize: 11, lineHeight: 17 },
});
