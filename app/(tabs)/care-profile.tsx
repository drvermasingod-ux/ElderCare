import { StyleSheet, Text, TextInput } from "react-native";
import { ActionButton, Card, FieldLabel } from "@/components/care-ui";
import { CareScreen, NoticeCard } from "@/components/care-screen";
import { palette } from "@/lib/eldercare";

export default function CareProfileScreen() {
  return (
    <CareScreen eyebrow="Profile setup" title="Caregiver profile" subtitle="Add an elder profile only after secure sign-in and consent are available.">
      <Card style={styles.formCard}>
        <FieldPreview label="Name" placeholder="Not added" />
        <Text style={styles.rowLabel}>Age and gender</Text>
        <TextInput accessibilityHint="Read-only placeholder; no data is collected" editable={false} placeholder="Age not added" style={styles.input} />
        <TextInput accessibilityHint="Read-only placeholder; no data is collected" editable={false} placeholder="Gender not added" style={styles.input} />
        <FieldPreview label="Medical history" placeholder="No information loaded" multiline />
        <Text style={styles.formNote}>These are visual placeholders only. Nothing is being typed, stored or sent.</Text>
        <ActionButton accessibilityHint="Unavailable; no profile will be saved" disabled icon="lock-outline" onPress={() => undefined}>Profile setup unavailable</ActionButton>
      </Card>
      <NoticeCard icon="privacy-tip" title="Consent before care details" description="Sensitive profile information will remain unavailable until a verified account, consent flow and authorized save API are implemented." />
    </CareScreen>
  );
}

function FieldPreview({ label, placeholder, multiline = false }: { label: string; placeholder: string; multiline?: boolean }) {
  return (
    <>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        accessibilityHint="Read-only placeholder; no data is collected"
        editable={false}
        multiline={multiline}
        placeholder={placeholder}
        style={[styles.input, multiline && styles.multiline]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  formCard: { gap: 9 },
  rowLabel: { color: palette.darkMuted, fontSize: 12, fontWeight: "800", marginTop: 3 },
  input: { backgroundColor: "#F7FBFD", borderColor: palette.line, borderRadius: 13, borderWidth: 1, color: palette.muted, fontSize: 13, minHeight: 47, paddingHorizontal: 13, paddingVertical: 10 },
  multiline: { minHeight: 90, textAlignVertical: "top" },
  formNote: { color: palette.muted, fontSize: 11, lineHeight: 16 },
});
