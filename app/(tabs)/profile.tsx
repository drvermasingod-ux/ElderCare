import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Eyebrow, LogoMark } from "@/components/care-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { palette } from "@/lib/eldercare";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const signOut = async () => {
    await logout();
    router.replace("/");
  };

  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.brandRow}><LogoMark compact /><Text style={styles.brand}>ElderCare Companion</Text></View>
    <Eyebrow>Verified account</Eyebrow>
    <Text style={styles.title}>Account & safety</Text>
    <Card style={styles.card}><Text style={styles.label}>Name</Text><Text style={styles.value}>{user?.name || "Not provided"}</Text><Text style={styles.label}>Verified role</Text><Text style={styles.value}>{user?.role || "Unavailable"}</Text><Text style={styles.note}>Account information is loaded from the server session. Role selection in the app is not trusted.</Text></Card>
    <Pressable accessibilityRole="button" onPress={() => void signOut()} style={styles.signOut}><MaterialIcons name="logout" size={18} color={palette.terracotta} /><Text style={styles.signOutText}>Sign out securely</Text></Pressable>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { padding: 22, paddingTop: 26 }, brandRow: { alignItems: "center", flexDirection: "row", gap: 9, marginBottom: 28 }, brand: { color: palette.ink, fontFamily: "serif", fontSize: 18, fontWeight: "700" }, title: { color: palette.ink, fontFamily: "serif", fontSize: 30, fontWeight: "700", marginTop: 8 }, card: { gap: 7, marginTop: 22 }, label: { color: palette.muted, fontSize: 11, fontWeight: "800", marginTop: 7, textTransform: "uppercase" }, value: { color: palette.ink, fontSize: 15, fontWeight: "700" }, note: { borderTopColor: palette.line, borderTopWidth: 1, color: palette.darkMuted, fontSize: 12, lineHeight: 18, marginTop: 8, paddingTop: 10 }, signOut: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 8, marginTop: 21, padding: 8 }, signOutText: { color: palette.terracotta, fontSize: 14, fontWeight: "800" } });
