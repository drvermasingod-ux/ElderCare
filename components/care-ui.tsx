import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import { palette } from "@/lib/eldercare";

export function LogoMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.logoWrap, compact && styles.logoWrapCompact]}>
      <Image
        accessibilityLabel="ElderCare Companion logo"
        source={require("@/assets/images/eldercare-mark.png")}
        resizeMode="contain"
        style={styles.logoImage}
      />
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

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Rule() {
  return <View style={styles.rule} />;
}

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warm" | "alert" }) {
  const toneStyle = tone === "good" ? styles.pillGood : tone === "warm" ? styles.pillWarm : tone === "alert" ? styles.pillAlert : styles.pillNeutral;
  return (
    <View style={[styles.pill, toneStyle]}>
      <Text style={[styles.pillText, tone === "alert" && styles.pillAlertText]}>{label}</Text>
    </View>
  );
}

export function IconBadge({ name, color = palette.primary, background = palette.primaryWash, size = 40 }: { name: keyof typeof MaterialIcons.glyphMap; color?: string; background?: string; size?: number }) {
  return (
    <View style={[styles.iconBadge, { width: size, height: size, borderRadius: size / 2, backgroundColor: background }]}>
      <MaterialIcons name={name} size={size * 0.52} color={color} />
    </View>
  );
}

export function ActionButton({ children, onPress, variant = "primary", icon, disabled = false, ...props }: PressableProps & { children: ReactNode; variant?: "primary" | "secondary" | "danger"; icon?: keyof typeof MaterialIcons.glyphMap }) {
  const { style: customStyle, ...pressableProps } = props;
  const buttonStyle = variant === "danger" ? styles.dangerButton : variant === "secondary" ? styles.secondaryButton : styles.primaryButton;
  const textStyle = variant === "secondary" ? styles.secondaryButtonText : styles.primaryButtonText;
  const iconColor = variant === "secondary" ? palette.ink : palette.white;
  return (
    <Pressable
      {...pressableProps}
      disabled={disabled}
      onPress={onPress}
      style={(state) => [styles.button, buttonStyle, typeof customStyle === "function" ? customStyle(state) : customStyle, state.pressed && styles.pressed, disabled && styles.disabled]}
    >
      {icon ? <MaterialIcons name={icon} size={19} color={iconColor} /> : null}
      <Text style={[styles.buttonText, textStyle]}>{children}</Text>
    </Pressable>
  );
}

export function Avatar({ initials, size = 52 }: { initials: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.31 }]}>{initials}</Text>
    </View>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  logoWrap: { width: 46, height: 46, borderRadius: 16, backgroundColor: palette.white, borderColor: palette.line, borderWidth: 1, overflow: "hidden" },
  logoWrapCompact: { width: 38, height: 38, borderRadius: 13 },
  logoImage: { height: "100%", width: "100%" },
  eyebrow: { color: palette.primaryDark, fontSize: 11, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  sectionTitleRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: palette.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.25 },
  card: { backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 22, borderWidth: 1, padding: 17, shadowColor: "#18364A", shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.045, shadowRadius: 14, elevation: 2 },
  rule: { backgroundColor: palette.line, height: 1, width: "100%" },
  pill: { alignSelf: "flex-start", borderRadius: 99, minHeight: 26, justifyContent: "center", paddingHorizontal: 10, paddingVertical: 5 },
  pillNeutral: { backgroundColor: "#EEF3F5" },
  pillGood: { backgroundColor: palette.primaryWash },
  pillWarm: { backgroundColor: palette.ochreWash },
  pillAlert: { backgroundColor: palette.terracottaWash },
  pillText: { color: palette.darkMuted, fontSize: 11, fontWeight: "800" },
  pillAlertText: { color: palette.terracotta },
  iconBadge: { alignItems: "center", justifyContent: "center" },
  button: { alignItems: "center", borderRadius: 15, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 },
  primaryButton: { backgroundColor: palette.primary },
  secondaryButton: { backgroundColor: palette.white, borderColor: palette.primary, borderWidth: 1 },
  dangerButton: { backgroundColor: palette.terracotta },
  buttonText: { fontSize: 15, fontWeight: "800" },
  primaryButtonText: { color: palette.white },
  secondaryButtonText: { color: palette.primaryDark },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.48 },
  avatar: { alignItems: "center", backgroundColor: palette.primaryWash, justifyContent: "center" },
  avatarText: { color: palette.ink, fontWeight: "800" },
  fieldLabel: { color: palette.darkMuted, fontSize: 12, fontWeight: "700", marginBottom: 7 },
});
