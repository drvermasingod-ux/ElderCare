import { StyleSheet, Text, View } from "react-native";
import { ActionButton, Card, StatusPill } from "@/components/care-ui";
import { CareScreen, EmptyStateCard, NoticeCard } from "@/components/care-screen";
import { palette } from "@/lib/eldercare";

export default function FamilyScreen() {
  return (
    <CareScreen eyebrow="Care circle" title="Family and caregivers" subtitle="Keep chosen family and trusted care partners connected with consent-based sharing.">
      <Card style={styles.familyCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Connected family</Text>
          <StatusPill label="NOT LOADED" tone="neutral" />
        </View>
        <EmptyStateCard icon="people-outline" title="No family links loaded" description="The service has not returned any authorized family or caregiver relationships." style={styles.nestedEmpty} />
        <ActionButton accessibilityHint="Unavailable. No invitation will be created." disabled icon="person-add-alt-1" onPress={() => undefined} variant="secondary">Add family member</ActionButton>
        <Text style={styles.actionNote}>No invitation code has been generated. Secure linking needs verified accounts, consent and a server-issued one-time invite.</Text>
      </Card>

      <NoticeCard icon="verified-user" title="Sharing stays in your control" description="Only people explicitly linked and authorized by the account holder should see care information." />
    </CareScreen>
  );
}

const styles = StyleSheet.create({
  familyCard: { gap: 12 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  nestedEmpty: { backgroundColor: "#F8FCFE", borderStyle: "dashed", elevation: 0, shadowOpacity: 0 },
  actionNote: { color: palette.muted, fontSize: 11, lineHeight: 17, textAlign: "center" },
});
