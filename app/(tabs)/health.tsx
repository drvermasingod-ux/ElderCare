import { StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, IconBadge, StatusPill } from "@/components/care-ui";
import { CareScreen, NoticeCard } from "@/components/care-screen";
import { palette } from "@/lib/eldercare";

type MetricIcon = "favorite-border" | "directions-walk" | "location-on";

export default function HealthScreen() {
  return (
    <CareScreen eyebrow="Safety & wellbeing" title="Health and SOS" subtitle="Health indicators appear only when you connect an authorized data source and grant permission.">
      <View style={styles.metricStack}>
        <MetricStatus icon="favorite-border" title="Heart rate" detail="No health reading connected" />
        <MetricStatus icon="directions-walk" title="Steps" detail="No activity data connected" />
        <MetricStatus icon="location-on" title="Location" detail="Location sharing is not connected" />
      </View>

      <Card style={styles.sosCard}>
        <View style={styles.sosHeader}>
          <View style={styles.sosIcon}><Text style={styles.heart}>♥</Text></View>
          <View style={styles.sosCopy}><Text style={styles.sosTitle}>Emergency support</Text><Text style={styles.sosDescription}>SOS delivery is not connected to an authorized alert service.</Text></View>
        </View>
        <ActionButton accessibilityHint="Unavailable. No alert will be sent." disabled icon="emergency" onPress={() => undefined} variant="danger">SOS unavailable</ActionButton>
        <Text style={styles.noAlert}>No alert has been sent. If anyone may be in immediate danger, contact local emergency services directly.</Text>
        <StatusPill label="NOT CONNECTED" tone="alert" />
      </Card>

      <NoticeCard icon="privacy-tip" title="Your consent matters" description="Health, step and location data will remain hidden unless the account holder chooses to connect and share it." />
    </CareScreen>
  );
}

function MetricStatus({ icon, title, detail }: { icon: MetricIcon; title: string; detail: string }) {
  return (
    <Card style={styles.metricCard}>
      <IconBadge name={icon} size={42} />
      <View style={styles.metricCopy}><Text style={styles.metricTitle}>{title}</Text><Text style={styles.metricDetail}>{detail}</Text></View>
      <StatusPill label="NOT CONNECTED" tone="neutral" />
    </Card>
  );
}

const styles = StyleSheet.create({
  metricStack: { gap: 10 },
  metricCard: { alignItems: "center", flexDirection: "row", gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  metricCopy: { flex: 1, gap: 3 },
  metricTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  metricDetail: { color: palette.darkMuted, fontSize: 11, lineHeight: 16 },
  sosCard: { backgroundColor: "#FFF9F9", borderColor: "#F1CECE", gap: 12 },
  sosHeader: { alignItems: "center", flexDirection: "row", gap: 11 },
  sosIcon: { alignItems: "center", backgroundColor: palette.terracottaWash, borderRadius: 17, height: 44, justifyContent: "center", width: 44 },
  heart: { color: palette.terracotta, fontSize: 22 },
  sosCopy: { flex: 1, gap: 3 },
  sosTitle: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  sosDescription: { color: palette.darkMuted, fontSize: 12, lineHeight: 18 },
  noAlert: { color: palette.terracotta, fontSize: 11, fontWeight: "700", lineHeight: 17 },
});
