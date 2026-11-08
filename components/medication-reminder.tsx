import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";
import { Card } from "@/components/care-ui";
import { palette } from "@/lib/eldercare";

export function MedicationReminderCard() {
  return <Card style={styles.card}>
    <MaterialIcons name="notifications-off" size={20} color={palette.muted} />
    <View style={styles.copy}>
      <Text style={styles.title}>Medication reminders are unavailable</Text>
      <Text style={styles.note}>No schedule is configured. This screen does not confirm a dose or notify family members.</Text>
    </View>
  </Card>;
}

const styles = StyleSheet.create({ card: { alignItems: "flex-start", flexDirection: "row", gap: 10, marginVertical: 10 }, copy: { flex: 1 }, title: { color: palette.ink, fontSize: 13, fontWeight: "800" }, note: { color: palette.darkMuted, fontSize: 12, lineHeight: 17, marginTop: 4 } });
