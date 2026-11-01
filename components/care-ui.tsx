import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type PressableProps } from "react-native";
import { palette } from "@/lib/eldercare";

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.logoWrap, compact && styles.logoWrapCompact]}>
      <View style={styles.logoLeafOne} />
      <View style={styles.logoLeafTwo} />
      <View style={styles.logoWindow} />
    </View>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {action}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Rule() {
  return <View style={styles.rule} />;
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warm" | "alert" }) {
  const toneStyle = tone === "good" ? styles.pillGood : tone === "warm" ? styles.pillWarm : tone === "alert" ? styles.pillAlert : styles.pillNeutral;
  return <View style={[styles.pill, toneStyle]}><Text style={[styles.pillText, tone === "alert" && styles.pillAlertText]}>{label}</Text></View>;
}

export function IconBadge({ name, color = palette.ink, background = palette.sageWash, size = 38 }: { name: keyof typeof MaterialIcons.glyphMap; color?: string; background?: string; size?: number }) {
  return <View style={[styles.iconBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}><MaterialIcons name={name} size={size * 0.52} color={color} /></View>;
}

export function ActionButton({ children, onPress, variant = "primary", icon, disabled = false, ...props }: PressableProps & { children: ReactNode; variant?: "primary" | "secondary" | "danger"; icon?: keyof typeof MaterialIcons.glyphMap }) {
  const buttonStyle = variant === "danger" ? styles.dangerButton : variant === "secondary" ? styles.secondaryButton : styles.primaryButton;
  const textStyle = variant === "secondary" ? styles.secondaryButtonText : styles.primaryButtonText;
  return (
    <Pressable {...props} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, buttonStyle, pressed && styles.pressed, disabled && styles.disabled]}>
      {icon ? <MaterialIcons name={icon} size={18} color={variant === "secondary" ? palette.ink : palette.white} /> : null}
      <Text style={[styles.buttonText, textStyle]}>{children}</Text>
    </Pressable>
  );
}

export function Avatar({ initials, size = 52 }: { initials: string; size?: number }) {
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}><Text style={[styles.avatarText, { fontSize: size * 0.31 }]}>{initials}</Text></View>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  logoWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: palette.ink, overflow: "hidden", position: "relative" },
  logoWrapCompact: { width: 34, height: 34, borderRadius: 11 },
  logoLeafOne: { position: "absolute", width: 14, height: 24, borderRadius: 14, backgroundColor: palette.sage, transform: [{ rotate: "-28deg" }], left: 6, top: 5 },
  logoLeafTwo: { position: "absolute", width: 12, height: 20, borderRadius: 12, backgroundColor: "#D4B76A", transform: [{ rotate: "28deg" }], right: 7, top: 8 },
  logoWindow: { position: "absolute", width: 12, height: 12, borderRadius: 3, borderWidth: 2, borderColor: palette.ivory, left: 15, bottom: 7 },
  eyebrow: { color: palette.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  sectionTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: palette.ink, fontFamily: "serif", fontSize: 21, fontWeight: "700" },
  card: { backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 22, borderWidth: 1, padding: 17 },
  rule: { backgroundColor: palette.line, height: 1, width: "100%" },
  pill: { alignSelf: "flex-start", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  pillNeutral: { backgroundColor: "#EEF1F1" },
  pillGood: { backgroundColor: palette.sageWash },
  pillWarm: { backgroundColor: palette.ochreWash },
  pillAlert: { backgroundColor: palette.terracottaWash },
  pillText: { color: palette.darkMuted, fontSize: 11, fontWeight: "700" },
  pillAlertText: { color: palette.terracotta },
  iconBadge: { alignItems: "center", justifyContent: "center" },
  button: { alignItems: "center", borderRadius: 14, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50, paddingHorizontal: 17 },
  primaryButton: { backgroundColor: palette.ink },
  secondaryButton: { backgroundColor: palette.white, borderColor: palette.line, borderWidth: 1 },
  dangerButton: { backgroundColor: palette.terracotta },
  buttonText: { fontSize: 14, fontWeight: "800" },
  primaryButtonText: { color: palette.white },
  secondaryButtonText: { color: palette.ink },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.5 },
  avatar: { alignItems: "center", backgroundColor: palette.ochreWash, justifyContent: "center" },
  avatarText: { color: palette.ink, fontWeight: "800" },
  fieldLabel: { color: palette.darkMuted, fontSize: 12, fontWeight: "700", marginBottom: 7 },
});
