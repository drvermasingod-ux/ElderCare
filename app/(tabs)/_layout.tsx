import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { useAuth } from "@/hooks/use-auth";
import { palette } from "@/lib/eldercare";

const allowedRoles = new Set(["parent", "child", "staff"]);

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={palette.primary} /><Text style={styles.message}>Verifying your account…</Text></View>;
  }
  if (!user || !allowedRoles.has(user.role ?? "")) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primaryDark,
        tabBarInactiveTintColor: palette.muted,
        tabBarButton: HapticTab,
        tabBarLabelStyle: { fontSize: 10, fontWeight: "800" },
        tabBarStyle: {
          backgroundColor: palette.white,
          borderTopColor: palette.line,
          borderTopWidth: 1,
          height: 66 + bottomPadding,
          paddingBottom: bottomPadding,
          paddingTop: 7,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color, size }) => <MaterialIcons name="home-filled" size={size} color={color} /> }} />
      <Tabs.Screen name="medications" options={{ title: "Meds", tabBarIcon: ({ color, size }) => <MaterialIcons name="medication" size={size} color={color} /> }} />
      <Tabs.Screen name="health" options={{ title: "SOS", tabBarIcon: ({ color, size }) => <MaterialIcons name="monitor-heart" size={size} color={color} /> }} />
      <Tabs.Screen name="family" options={{ title: "Family", tabBarIcon: ({ color, size }) => <MaterialIcons name="people-alt" size={size} color={color} /> }} />
      <Tabs.Screen name="care-profile" options={{ href: null }} />
      <Tabs.Screen name="visits" options={{ href: null }} />
      <Tabs.Screen name="vault" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", backgroundColor: palette.background, flex: 1, gap: 12, justifyContent: "center", padding: 24 },
  message: { color: palette.inkSoft, fontSize: 14 },
});
