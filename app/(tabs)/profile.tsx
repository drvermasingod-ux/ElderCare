import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Avatar, Card, Eyebrow, LogoMark, SectionTitle, StatusPill } from "@/components/care-ui";
import { palette, roleFromParam } from "@/lib/eldercare";

function Row({ icon, label, detail, danger = false, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; detail: string; danger?: boolean; onPress?: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}><View style={[styles.rowIcon, danger && styles.rowIconDanger]}><MaterialIcons name={icon} size={19} color={danger ? palette.terracotta : palette.ink} /></View><View style={styles.flex}><Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text><Text style={styles.rowDetail}>{detail}</Text></View><MaterialIcons name="chevron-right" size={19} color={palette.muted} /></Pressable>;
}

function ProfileScreen() {
  const params = useGlobalSearchParams<{ role?: string | string[] }>();
  const role = roleFromParam(params.role);
  const router = useRouter();
  const staff = role === "staff";
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><View style={styles.header}><View style={styles.brandLine}><LogoMark compact /><Text style={styles.brandName}>ElderCare</Text></View><Eyebrow>{staff ? "Care partner profile" : "Family settings"}</Eyebrow><Text style={styles.pageTitle}>{staff ? "Ravi Menon" : "Meera Sharma"}</Text><Text style={styles.pageIntro}>{staff ? "Verified care partner · Pune East" : "Managing care for Asha Sharma"}</Text><View style={styles.profileLine}><Avatar initials={staff ? "RM" : "MS"} size={64} /><View style={styles.flex}><StatusPill label="Account active" tone="good" /><Text style={styles.profileMeta}>{staff ? "Phone ending 6842 · staff role" : "Phone ending 1846 · client role"}</Text></View></View></View><SectionTitle>Account & safety</SectionTitle><Card style={styles.menuCard}><Row icon="notifications-none" label="Notifications" detail="Reminders, visit updates, SOS status" /><Row icon="lock-outline" label="Privacy & consent" detail="Location, photos, medical records" /><Row icon="language" label="Language" detail="English · ready for localization" /></Card><SectionTitle>Support</SectionTitle><Card style={styles.menuCard}><Row icon="support-agent" label="Contact support" detail="Ask about a booking or care plan" /><Row icon="help-outline" label="Safety guidance" detail="Automated alerts do not replace emergency services" /></Card><Card style={styles.demoCard}><MaterialIcons name="info-outline" size={18} color={palette.ochre} /><View style={styles.flex}><Text style={styles.demoTitle}>Demo mode</Text><Text style={styles.demoText}>This preview uses sample records. Firebase OTP, role lookup, file storage, maps, payments, and outbound voice reminders are integration points described in the backend contract.</Text></View></Card><Pressable onPress={() => router.replace("/")} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><MaterialIcons name="logout" size={18} color={palette.terracotta} /><Text style={styles.logoutText}>Secure logout</Text></Pressable></ScrollView></ScreenContainer>;
}

export default ProfileScreen;

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 38 },
  header: { marginBottom: 27 },
  brandLine: { alignItems: "center", flexDirection: "row", gap: 9, marginBottom: 24 },
  brandName: { color: palette.ink, fontFamily: "serif", fontSize: 19, fontWeight: "700" },
  pageTitle: { color: palette.ink, fontFamily: "serif", fontSize: 32, fontWeight: "700", marginTop: 6 },
  pageIntro: { color: palette.inkSoft, fontSize: 13, marginTop: 5 },
  profileLine: { alignItems: "center", flexDirection: "row", gap: 14, marginTop: 17 },
  profileMeta: { color: palette.muted, fontSize: 11, marginTop: 7 },
  menuCard: { marginBottom: 25, paddingVertical: 3 },
  row: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 68 },
  rowIcon: { alignItems: "center", backgroundColor: palette.sageWash, borderRadius: 13, height: 37, justifyContent: "center", width: 37 },
  rowIconDanger: { backgroundColor: palette.terracottaWash },
  rowLabel: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  dangerText: { color: palette.terracotta },
  rowDetail: { color: palette.muted, fontSize: 10, marginTop: 4 },
  flex: { flex: 1 },
  demoCard: { alignItems: "flex-start", backgroundColor: palette.ochreWash, borderColor: "#E9D6A7", borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 10, marginBottom: 20, padding: 13 },
  demoTitle: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  demoText: { color: palette.darkMuted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  logout: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 8, padding: 12 },
  logoutText: { color: palette.terracotta, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
