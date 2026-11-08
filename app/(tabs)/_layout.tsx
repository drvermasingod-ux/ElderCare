import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { palette } from "@/lib/eldercare";
import { useAuth } from "@/hooks/use-auth";

const allowedRoles = new Set(["parent", "child", "staff"]);

export default function TabLayout() {
  const { user, loading } = useAuth();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={palette.terracotta} /><Text style={styles.message}>Verifying your account…</Text></View>;
  }
  if (!user || !allowedRoles.has(user.role ?? "")) {
    return <Redirect href="/" />;
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: palette.terracotta, tabBarInactiveTintColor: palette.muted, tabBarButton: HapticTab, tabBarLabelStyle: { fontSize: 11, fontWeight: "700" }, tabBarStyle: { backgroundColor: palette.paper, borderTopColor: palette.line, borderTopWidth: 1, height: 62 + bottomPadding, paddingBottom: bottomPadding, paddingTop: 6 } }}>
      <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: ({ color, size }) => <MaterialIcons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="visits" options={{ title: "Visits", tabBarIcon: ({ color, size }) => <MaterialIcons name="assignment" size={size} color={color} /> }} />
      <Tabs.Screen name="vault" options={{ title: "Vault", tabBarIcon: ({ color, size }) => <MaterialIcons name="folder-shared" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "You", tabBarIcon: ({ color, size }) => <MaterialIcons name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({ center: { alignItems: "center", backgroundColor: palette.ivory, flex: 1, gap: 12, justifyContent: "center", padding: 24 }, message: { color: palette.inkSoft, fontSize: 14 } });
