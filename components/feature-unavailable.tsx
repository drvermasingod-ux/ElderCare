import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Card, StatusPill } from "@/components/care-ui";
import { CareScreen } from "@/components/care-screen";
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

  const statusLabel = apiHealth === "checking" ? "CHECKING" : apiHealth === "available" ? "API REACHABLE" : "UNAVAILABLE";
  return (
    <CareScreen eyebrow="Protected care service" title={title} subtitle={description}>
      <Card style={{ gap: 12 }}>
        <View style={{ alignItems: "center", flexDirection: "row", gap: 9 }}>
          {apiHealth === "checking"
            ? <ActivityIndicator color={palette.primary} />
            : <MaterialIcons name={apiHealth === "available" ? "cloud-done" : "cloud-off"} size={20} color={apiHealth === "available" ? palette.primary : palette.terracotta} />}
          <StatusPill label={statusLabel} tone={apiHealth === "available" ? "good" : "warm"} />
        </View>
        <View style={{ backgroundColor: palette.line, height: 1 }} />
        <View style={{ alignItems: "flex-start", flexDirection: "row", gap: 8 }}>
          <MaterialIcons name="info-outline" size={17} color={palette.primaryDark} />
          <Text style={{ color: palette.darkMuted, flex: 1, fontSize: 12, lineHeight: 18 }}>
            API reachability does not confirm Firebase authentication or care data. No sample records or successful actions are shown.
          </Text>
        </View>
      </Card>
    </CareScreen>
  );
}
