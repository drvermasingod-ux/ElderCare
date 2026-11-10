import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { Card, Eyebrow, IconBadge, LogoMark } from "@/components/care-ui";
import { ScreenContainer } from "@/components/screen-container";
import { palette } from "@/lib/eldercare";

export function CareScreen({
  eyebrow,
  title,
  subtitle,
  children,
  contentStyle,
  showSettings = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  showSettings?: boolean;
}) {
  const router = useRouter();
  return (
    <ScreenContainer containerClassName="bg-[#EAF6FC]" safeAreaClassName="bg-[#EAF6FC]">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.page, contentStyle]}>
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <LogoMark compact />
              <View>
                <Text style={styles.brand}>ElderCare</Text>
                <Text style={styles.brandSub}>COMPANION</Text>
              </View>
            </View>
            {showSettings ? (
              <Pressable
                accessibilityLabel="Account and settings"
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.push("/(tabs)/profile")}
                style={styles.settingsButton}
              >
                <MaterialIcons name="settings" size={21} color={palette.ink} />
              </Pressable>
            ) : null}
          </View>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.body}>{children}</View>
          <Text style={styles.footer}>Care data appears only when it is verified and shared with your permission.</Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

export function EmptyStateCard({
  icon,
  title,
  description,
  style,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card style={[styles.emptyCard, style]}>
      <IconBadge name={icon} size={46} />
      <View style={styles.emptyCopy}>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyDescription}>{description}</Text>
      </View>
    </Card>
  );
}

export function NoticeCard({
  icon,
  title,
  description,
  tone = "neutral",
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
  tone?: "neutral" | "alert";
}) {
  return (
    <Card style={[styles.noticeCard, tone === "alert" && styles.noticeAlert]}>
      <IconBadge
        name={icon}
        color={tone === "alert" ? palette.terracotta : palette.primary}
        background={tone === "alert" ? palette.terracottaWash : palette.primaryWash}
        size={40}
      />
      <View style={styles.noticeCopy}>
        <Text style={styles.noticeTitle}>{title}</Text>
        <Text style={styles.noticeDescription}>{description}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  page: { alignSelf: "center", maxWidth: 520, paddingBottom: 30, paddingHorizontal: 18, paddingTop: 12, width: "100%" },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 22 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  brand: { color: palette.ink, fontSize: 17, fontWeight: "900", letterSpacing: -0.35 },
  brandSub: { color: palette.primaryDark, fontSize: 9, fontWeight: "900", letterSpacing: 1.7, marginTop: 1 },
  settingsButton: { alignItems: "center", backgroundColor: palette.white, borderColor: palette.line, borderRadius: 16, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  title: { color: palette.ink, fontSize: 28, fontWeight: "900", letterSpacing: -0.55, lineHeight: 34, marginTop: 6 },
  subtitle: { color: palette.inkSoft, fontSize: 14, lineHeight: 21, marginTop: 8 },
  body: { gap: 14, marginTop: 20 },
  footer: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 23, textAlign: "center" },
  emptyCard: { alignItems: "flex-start", flexDirection: "row", gap: 13, padding: 16 },
  emptyCopy: { flex: 1, gap: 4, paddingTop: 2 },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  emptyDescription: { color: palette.darkMuted, fontSize: 13, lineHeight: 19 },
  noticeCard: { alignItems: "flex-start", flexDirection: "row", gap: 12, padding: 15 },
  noticeAlert: { borderColor: "#F2C9C9" },
  noticeCopy: { flex: 1, gap: 4, paddingTop: 1 },
  noticeTitle: { color: palette.ink, fontSize: 14, fontWeight: "800", lineHeight: 19 },
  noticeDescription: { color: palette.darkMuted, fontSize: 12, lineHeight: 18 },
});
