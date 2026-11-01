import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ActionButton, Card, Eyebrow, LogoMark } from "@/components/care-ui";
import { palette } from "@/lib/eldercare";

export default function EntryScreen() {
  const router = useRouter();
  const enter = (role: "client" | "staff") => router.replace({ pathname: "/(tabs)", params: { role } });

  return (
    <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}><LogoMark /><View><Text style={styles.brandName}>ElderCare</Text><Text style={styles.brandSub}>Companion</Text></View></View>
        <View style={styles.heroRule} />
        <Eyebrow>A steady hand, wherever you are</Eyebrow>
        <Text style={styles.title}>Care feels closer{"\n"}when it is coordinated.</Text>
        <Text style={styles.intro}>A calm place for families and care partners to stay in step — with the people who matter most.</Text>

        <Text style={styles.chooseLabel}>Continue as</Text>
        <Card style={styles.roleCard}>
          <View style={styles.roleHeading}><View style={[styles.roleIcon, { backgroundColor: palette.sageWash }]}><MaterialIcons name="family-restroom" size={24} color={palette.ink} /></View><View style={styles.roleCopy}><Text style={styles.roleTitle}>Family portal</Text><Text style={styles.roleText}>See Mum’s care, book support, and stay reassured.</Text></View><MaterialIcons name="arrow-forward-ios" size={15} color={palette.muted} /></View>
          <ActionButton icon="arrow-forward" onPress={() => enter("client")}>Enter family portal</ActionButton>
        </Card>
        <Card style={styles.roleCard}>
          <View style={styles.roleHeading}><View style={[styles.roleIcon, { backgroundColor: palette.ochreWash }]}><MaterialIcons name="route" size={24} color={palette.ink} /></View><View style={styles.roleCopy}><Text style={styles.roleTitle}>Care partner</Text><Text style={styles.roleText}>Follow today’s route, check in, and close the loop.</Text></View><MaterialIcons name="arrow-forward-ios" size={15} color={palette.muted} /></View>
          <ActionButton variant="secondary" icon="arrow-forward" onPress={() => enter("staff")}>Enter care partner portal</ActionButton>
        </Card>

        <View style={styles.trustRow}><MaterialIcons name="verified-user" size={17} color={palette.sage} /><Text style={styles.trustText}>Role-based access · sensitive actions require confirmation</Text></View>
        <Pressable onPress={() => {}} style={styles.helpLink}><Text style={styles.helpText}>Need help signing in?</Text><MaterialIcons name="arrow-outward" size={15} color={palette.terracotta} /></Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 42 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 11, marginBottom: 26 },
  brandName: { color: palette.ink, fontFamily: "serif", fontSize: 25, fontWeight: "700", letterSpacing: -0.3 },
  brandSub: { color: palette.terracotta, fontSize: 10, fontWeight: "800", letterSpacing: 2.2, textTransform: "uppercase" },
  heroRule: { backgroundColor: palette.ink, height: 2, marginBottom: 25, opacity: 0.9, width: 42 },
  title: { color: palette.ink, fontFamily: "serif", fontSize: 38, fontWeight: "700", letterSpacing: -0.8, lineHeight: 43, marginTop: 10 },
  intro: { color: palette.inkSoft, fontSize: 15, lineHeight: 24, marginTop: 14, maxWidth: 340 },
  chooseLabel: { color: palette.ink, fontSize: 13, fontWeight: "800", marginBottom: 10, marginTop: 34 },
  roleCard: { gap: 16, marginBottom: 12 },
  roleHeading: { alignItems: "center", flexDirection: "row", gap: 12 },
  roleIcon: { alignItems: "center", borderRadius: 16, height: 48, justifyContent: "center", width: 48 },
  roleCopy: { flex: 1 },
  roleTitle: { color: palette.ink, fontSize: 17, fontWeight: "800" },
  roleText: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  trustRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 20 },
  trustText: { color: palette.darkMuted, flex: 1, fontSize: 11, lineHeight: 16 },
  helpLink: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginTop: 22 },
  helpText: { color: palette.terracotta, fontSize: 13, fontWeight: "800" },
});
