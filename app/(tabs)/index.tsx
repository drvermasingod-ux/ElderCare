import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Card, IconBadge, SectionTitle, StatusPill } from "@/components/care-ui";
import { CareScreen, EmptyStateCard } from "@/components/care-screen";
import { checkApiHealth, type ApiHealth } from "@/lib/api-health";
import { palette } from "@/lib/eldercare";

export default function HomeScreen() {
  const router = useRouter();
  const [apiHealth, setApiHealth] = useState<ApiHealth>("checking");

  useEffect(() => {
    let active = true;
    checkApiHealth().then((available) => {
      if (active) setApiHealth(available ? "available" : "unavailable");
    });
    return () => { active = false; };
  }, []);

  const statusLabel = apiHealth === "checking" ? "Checking service" : apiHealth === "available" ? "API reachable" : "Service unavailable";

  return (
    <CareScreen eyebrow="Care overview" title="Today, together" subtitle="A calm view of care updates shared with your permission.">
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          {apiHealth === "checking"
            ? <ActivityIndicator color={palette.primary} />
            : <MaterialIcons name={apiHealth === "available" ? "cloud-done" : "cloud-off"} size={21} color={apiHealth === "available" ? palette.primary : palette.terracotta} />}
          <View style={styles.statusCopy}><Text style={styles.statusTitle}>Care service</Text><Text style={styles.statusDescription}>{statusLabel}</Text></View>
          <StatusPill label={apiHealth === "available" ? "API REACHABLE" : apiHealth === "checking" ? "CHECKING" : "OFFLINE"} tone="neutral" />
        </View>
        <Text style={styles.statusNote}>A healthy API response does not mean care records or Firebase are enabled.</Text>
      </Card>

      <View style={styles.section}>
        <SectionTitle>Next medication</SectionTitle>
        <EmptyStateCard icon="medication" title="No schedule loaded" description="Medication times will appear here only after an authorized care schedule is connected." />
      </View>

      <View style={styles.section}>
        <SectionTitle>Care circle</SectionTitle>
        <EmptyStateCard icon="groups" title="No linked profiles loaded" description="Family and care-partner records are not available from the current service." />
      </View>

      <View style={styles.section}>
        <SectionTitle>Care tools</SectionTitle>
        <View style={styles.quickActions}>
          <QuickAction icon="person-outline" label="Care profile" onPress={() => router.push("/(tabs)/care-profile")} />
          <QuickAction icon="medical-services" label="Health & SOS" onPress={() => router.push("/(tabs)/health")} />
          <QuickAction icon="calendar-month" label="Visits" onPress={() => router.push("/(tabs)/visits")} />
          <QuickAction icon="folder-shared" label="Medical vault" onPress={() => router.push("/(tabs)/vault")} />
        </View>
      </View>

      <Card style={styles.recentCard}>
        <View style={styles.recentHeading}><IconBadge name="history" size={36} /><Text style={styles.recentTitle}>Recent activity</Text></View>
        <Text style={styles.recentDescription}>No activity has been loaded. This screen will not invent updates or care events.</Text>
      </Card>
    </CareScreen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <IconBadge name={icon} size={38} />
      <Text style={styles.quickLabel}>{label}</Text>
      <MaterialIcons name="chevron-right" size={18} color={palette.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  statusCard: { gap: 10, padding: 15 },
  statusHeader: { alignItems: "center", flexDirection: "row", gap: 9 },
  statusCopy: { flex: 1, gap: 2 },
  statusTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  statusDescription: { color: palette.darkMuted, fontSize: 12 },
  statusNote: { borderTopColor: palette.line, borderTopWidth: 1, color: palette.muted, fontSize: 11, lineHeight: 16, paddingTop: 9 },
  section: { gap: 10 },
  quickActions: { gap: 9 },
  quickAction: { alignItems: "center", backgroundColor: palette.white, borderColor: palette.line, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 64, paddingHorizontal: 12 },
  quickLabel: { color: palette.ink, flex: 1, fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.82 },
  recentCard: { gap: 11 },
  recentHeading: { alignItems: "center", flexDirection: "row", gap: 10 },
  recentTitle: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  recentDescription: { color: palette.darkMuted, fontSize: 12, lineHeight: 18 },
});
