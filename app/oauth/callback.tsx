import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { palette } from "@/lib/eldercare";

export default function RetiredOAuthCallback() {
  const router = useRouter();
  return (
    <ScreenContainer containerClassName="bg-[#EAF6FC]" safeAreaClassName="bg-[#EAF6FC]">
      <View style={styles.page}>
        <View style={styles.icon}><MaterialIcons name="verified-user" size={28} color={palette.primaryDark} /></View>
        <Text style={styles.title}>This sign-in link is no longer active</Text>
        <Text style={styles.copy}>ElderCare mobile sign-in now uses Firebase Phone OTP or Email/Password. A URL or legacy session token cannot sign you in. Return to the app and open the secure sign-in screen.</Text>
        <Pressable accessibilityRole="button" onPress={() => router.replace("/")} style={styles.button}>
          <Text style={styles.buttonText}>Return to ElderCare</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  page: { alignItems: "center", alignSelf: "center", gap: 16, justifyContent: "center", maxWidth: 420, padding: 24, width: "100%" },
  icon: { alignItems: "center", backgroundColor: palette.primaryWash, borderRadius: 30, height: 60, justifyContent: "center", width: 60 },
  title: { color: palette.ink, fontSize: 22, fontWeight: "900", textAlign: "center" },
  copy: { color: palette.darkMuted, fontSize: 14, lineHeight: 22, textAlign: "center" },
  button: { alignItems: "center", backgroundColor: palette.primary, borderRadius: 15, justifyContent: "center", minHeight: 50, paddingHorizontal: 24 },
  buttonText: { color: palette.white, fontSize: 15, fontWeight: "800" },
});
