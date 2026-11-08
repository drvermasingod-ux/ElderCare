import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { Card, Eyebrow, LogoMark } from "@/components/care-ui";
import { ScreenContainer } from "@/components/screen-container";
import { checkApiHealth, type ApiHealth } from "@/lib/api-health";
import { palette } from "@/lib/eldercare";

export function FeatureUnavailable({ title, description }: { title: string; description: string }) {
  const [apiHealth, setApiHealth] = useState<ApiHealth>("checking");
  useEffect(() => {
    let active = true;
    checkApiHealth().then((available) => {
      if (active) setApiHealth(available ? "available" : "unavailable");
    });
    return () => { active = false; };
  }, []);

  return (
    <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.brandRow}><LogoMark compact /><Text style={styles.brand}>ElderCare Companion</Text></View>
        <Eyebrow>Protected care service</Eyebrow>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <Card style={styles.card}>
          <View style={styles.statusRow}>
            {apiHealth === "checking" ? <ActivityIndicator color={palette.terracotta} /> : <MaterialIcons name={apiHealth === "available" ? "cloud-done" : "cloud-off"} size={20} color={apiHealth === "available" ? palette.sage : palette.terracotta} />}
            <Text style={styles.statusTitle}>{apiHealth === "checking" ? "Checking service" : apiHealth === "available" ? "API reachable" : "Service temporarily unavailable"}</Text>
          </View>
          <Text style={styles.note}>No sample records are shown. API reachability does not confirm that Firebase authentication, care data or this feature is enabled.</Text>
        </Card>
        <Text style={styles.emergency}>This app is not a replacement for local emergency services.</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: 22, paddingBottom: 42, paddingTop: 26 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 9, marginBottom: 28 },
  brand: { color: palette.ink, fontFamily: "serif", fontSize: 18, fontWeight: "700" },
  title: { color: palette.ink, fontFamily: "serif", fontSize: 30, fontWeight: "700", lineHeight: 37, marginTop: 9 },
  description: { color: palette.inkSoft, fontSize: 14, lineHeight: 21, marginTop: 9 },
  card: { gap: 12, marginTop: 23 },
  statusRow: { alignItems: "center", flexDirection: "row", gap: 9 },
  statusTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  note: { color: palette.darkMuted, fontSize: 12, lineHeight: 18 },
  emergency: { borderTopColor: palette.line, borderTopWidth: 1, color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 25, paddingTop: 14 },
});
