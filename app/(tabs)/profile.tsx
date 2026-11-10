import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { ActionButton, Card, StatusPill } from "@/components/care-ui";
import { CareScreen, NoticeCard } from "@/components/care-screen";
import { useAuth } from "@/hooks/use-auth";
import { palette } from "@/lib/eldercare";

function roleLabel(role?: string | null) {
  if (role === "parent") return "Parent";
  if (role === "child") return "Family member";
  if (role === "staff") return "Care partner";
  return "Unavailable";
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await logout();
    router.replace("/");
  };

  return (
    <CareScreen eyebrow="Account" title="Profile and settings" subtitle="Your account details come from the verified service session." showSettings={false}>
      <Card style={{ gap: 13 }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 12 }}>
          <View style={{ alignItems: "center", backgroundColor: palette.primaryWash, borderRadius: 28, height: 56, justifyContent: "center", width: 56 }}>
            <MaterialIcons name="person-outline" size={28} color={palette.primaryDark} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ color: palette.ink, fontSize: 16, fontWeight: "900" }}>{user?.name || "Name not provided"}</Text>
            <Text style={{ color: palette.darkMuted, fontSize: 12 }}>{user?.email || "No email on this account"}</Text>
          </View>
          <StatusPill label="VERIFIED" tone="good" />
        </View>
        <View style={{ backgroundColor: palette.line, height: 1 }} />
        <Text style={{ color: palette.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" }}>Trusted role</Text>
        <Text style={{ color: palette.ink, fontSize: 15, fontWeight: "900" }}>{roleLabel(user?.role)}</Text>
        <Text style={{ color: palette.darkMuted, fontSize: 12, lineHeight: 18 }}>The app cannot change your role. Only a trusted server response can grant access to care screens.</Text>
      </Card>

      <NoticeCard icon="security" title="Privacy and safety" description="Do not share account credentials. Care information is available only through authorized server access." />

      <ActionButton accessibilityLabel="Sign out securely" icon="logout" onPress={() => void signOut()} variant="secondary">{signingOut ? "Signing out…" : "Sign out"}</ActionButton>
    </CareScreen>
  );
}
