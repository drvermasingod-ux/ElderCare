import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, IconBadge } from "@/components/care-ui";
import { palette } from "@/lib/eldercare";

type ReminderState = "idle" | "scheduled" | "taken" | "denied" | "error";

export function MedicationReminderCard() {
  const [state, setState] = useState<ReminderState>("idle");
  const [busy, setBusy] = useState(false);

  const scheduleReminder = async () => {
    setBusy(true);
    try {
      if (Platform.OS === "web") {
        // Web Preview has no native scheduler; keep the interaction testable without claiming a browser reminder.
        setState("scheduled");
        return;
      }
      const permissions = await Notifications.requestPermissionsAsync();
      if (permissions.status !== "granted") {
        setState("denied");
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Medication reminder",
          body: "Asha’s evening medicine is due. Please confirm after she takes it.",
          sound: "default",
          data: { kind: "medication-reminder", elderlyId: "demo-asha" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 18,
          minute: 30,
        },
      });
      setState("scheduled");
    } catch {
      setState("error");
    } finally {
      setBusy(false);
    }
  };

  const statusCopy = state === "scheduled" ? "Reminder set for 18:30 on this phone." : state === "taken" ? "Taken recorded for today on this device." : state === "denied" ? "Notifications are off. Enable them in phone settings." : state === "error" ? "Could not schedule. Try again when the phone is online." : "A gentle reminder for Amlodipine + Vitamin D.";

  return (
    <Card style={styles.card}>
      <View style={styles.heading}>
        <IconBadge name="medication" color={palette.ochre} background={palette.ochreWash} size={42} />
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>Medication reminder</Text>
          <Text style={styles.title}>Evening medicines</Text>
          <Text style={styles.meta}>18:30 · Amlodipine + Vitamin D</Text>
        </View>
        <View style={[styles.statusDot, state === "scheduled" || state === "taken" ? styles.statusDotGood : null]} />
      </View>
      <Text style={styles.statusCopy}>{statusCopy}</Text>
      <View style={styles.actions}>
        {state === "scheduled" ? <ActionButton variant="secondary" icon="check-circle-outline" onPress={() => setState("taken")}>Mark as taken</ActionButton> : state === "taken" ? <View style={styles.takenBanner}><MaterialIcons name="verified" size={17} color={palette.sage} /><Text style={styles.takenText}>Done for today</Text></View> : <ActionButton variant="secondary" icon="notifications-active" onPress={scheduleReminder} disabled={busy}>{busy ? "Setting reminder…" : "Set phone reminder"}</ActionButton>}
        {state === "denied" || state === "error" ? <Pressable onPress={scheduleReminder} style={styles.retry}><Text style={styles.retryText}>Try again</Text></Pressable> : null}
      </View>
      <Text style={styles.disclaimer}>Phone reminder only. Family-wide alerts after missed doses require the trusted backend workflow.</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: palette.paper, marginBottom: 25 },
  heading: { alignItems: "center", flexDirection: "row", gap: 11 },
  copy: { flex: 1 },
  eyebrow: { color: palette.ochre, fontSize: 10, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  title: { color: palette.ink, fontFamily: "serif", fontSize: 20, fontWeight: "700", marginTop: 4 },
  meta: { color: palette.muted, fontSize: 11, marginTop: 3 },
  statusDot: { backgroundColor: palette.line, borderRadius: 6, height: 11, width: 11 },
  statusDotGood: { backgroundColor: palette.sage },
  statusCopy: { color: palette.inkSoft, fontSize: 11, lineHeight: 17, marginBottom: 13, marginTop: 13 },
  actions: { alignItems: "center", flexDirection: "row", gap: 10 },
  takenBanner: { alignItems: "center", backgroundColor: palette.sageWash, borderRadius: 14, flexDirection: "row", gap: 8, minHeight: 50, paddingHorizontal: 16 },
  takenText: { color: palette.darkMuted, fontSize: 13, fontWeight: "800" },
  retry: { paddingHorizontal: 4, paddingVertical: 10 },
  retryText: { color: palette.terracotta, fontSize: 12, fontWeight: "800" },
  disclaimer: { color: palette.muted, fontSize: 9, lineHeight: 14, marginTop: 11 },
});
