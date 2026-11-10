import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, IconBadge, SectionTitle, StatusPill } from "@/components/care-ui";
import { CareScreen, NoticeCard } from "@/components/care-screen";
import { palette } from "@/lib/eldercare";

const periods = ["Morning", "Afternoon", "Evening"] as const;
type Period = (typeof periods)[number];

export default function MedicationsScreen() {
  const [period, setPeriod] = useState<Period>("Morning");

  return (
    <CareScreen eyebrow="Daily care" title="Manage medications" subtitle="Schedules and dose updates must come from your authorized care plan.">
      <Card style={styles.scheduleCard}>
        <SectionTitle>Schedule</SectionTitle>
        <View accessibilityRole="tablist" style={styles.periods}>
          {periods.map((item) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: period === item }}
              key={item}
              onPress={() => setPeriod(item)}
              style={[styles.period, period === item && styles.selectedPeriod]}
            >
              <Text style={[styles.periodText, period === item && styles.selectedPeriodText]}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.emptySchedule}>
          <IconBadge name="medication" size={46} />
          <Text style={styles.emptyTitle}>No {period.toLowerCase()} schedule loaded</Text>
          <Text style={styles.emptyDescription}>No medication names or dose times are available from the care service yet.</Text>
          <StatusPill label="NOT LOADED" tone="neutral" />
        </View>
      </Card>

      <NoticeCard icon="notifications-off" title="Reminders are not active" description="No medication reminder is scheduled or being sent by this app." />

      <Card style={styles.actionCard}>
        <Text style={styles.actionTitle}>Dose actions</Text>
        <Text style={styles.actionCopy}>Mark as taken and reschedule will be enabled only after the service stores and confirms a real care plan.</Text>
        <View style={styles.buttons}>
          <ActionButton disabled icon="check-circle" onPress={() => undefined} style={styles.button}>Mark taken</ActionButton>
          <ActionButton disabled icon="schedule" onPress={() => undefined} variant="secondary" style={styles.button}>Reschedule</ActionButton>
        </View>
      </Card>
    </CareScreen>
  );
}

const styles = StyleSheet.create({
  scheduleCard: { gap: 13 },
  periods: { backgroundColor: palette.background, borderRadius: 13, flexDirection: "row", padding: 4 },
  period: { alignItems: "center", borderRadius: 10, flex: 1, justifyContent: "center", minHeight: 42, paddingHorizontal: 5 },
  selectedPeriod: { backgroundColor: palette.primary },
  periodText: { color: palette.darkMuted, fontSize: 12, fontWeight: "800" },
  selectedPeriodText: { color: palette.white },
  emptySchedule: { alignItems: "center", backgroundColor: "#F8FCFE", borderColor: palette.line, borderRadius: 18, borderWidth: 1, gap: 9, paddingHorizontal: 18, paddingVertical: 22 },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: "900", textAlign: "center" },
  emptyDescription: { color: palette.darkMuted, fontSize: 12, lineHeight: 18, textAlign: "center" },
  actionCard: { gap: 9 },
  actionTitle: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  actionCopy: { color: palette.darkMuted, fontSize: 12, lineHeight: 18 },
  buttons: { gap: 9, marginTop: 3 },
  button: { minHeight: 46 },
});
