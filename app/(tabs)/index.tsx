import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ActionButton, Avatar, Card, Eyebrow, IconBadge, LogoMark, SectionTitle, StatusPill } from "@/components/care-ui";
import { MedicationReminderCard } from "@/components/medication-reminder";
import { clientTasks, familyProfile, palette, roleFromParam, staffVisits, type Role } from "@/lib/eldercare";

function TopBar({ role }: { role: Role }) {
  return <View style={styles.topBar}><View style={styles.topBrand}><LogoMark compact /><View><Text style={styles.topBrandName}>ElderCare</Text><Text style={styles.topBrandSub}>{role === "staff" ? "Care partner" : "Family portal"}</Text></View></View><Pressable accessibilityLabel="Open alerts" style={styles.bell}><MaterialIcons name="notifications-none" size={22} color={palette.ink} /><View style={styles.bellDot} /></Pressable></View>;
}

function FamilyHome({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const [sosOpen, setSosOpen] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <TopBar role="client" />
    <View style={styles.greeting}><View><Eyebrow>Saturday, 02 November</Eyebrow><Text style={styles.pageTitle}>Good morning, Meera.</Text><Text style={styles.pageIntro}>Here is the care picture for Mum today.</Text></View><Avatar initials="MS" size={46} /></View>
    <Card style={styles.profileCard}><View style={styles.profileTop}><Avatar initials={familyProfile.initials} size={58} /><View style={styles.profileDetails}><Text style={styles.profileName}>{familyProfile.name}</Text><Text style={styles.profileRelation}>{familyProfile.relation} · {familyProfile.address}</Text><StatusPill label={familyProfile.plan} tone="good" /></View><MaterialIcons name="more-horiz" size={22} color={palette.muted} /></View><View style={styles.vitalsRow}>{familyProfile.vitals.map((vital) => <View key={vital.label} style={styles.vital}><Text style={styles.vitalLabel}>{vital.label}</Text><Text style={styles.vitalValue}>{vital.value}<Text style={styles.vitalUnit}> {vital.unit}</Text></Text><Text style={styles.vitalTime}>{vital.time} · {vital.source}</Text></View>)}</View></Card>
    <Pressable accessibilityRole="button" accessibilityLabel="Open emergency SOS confirmation" onPress={() => setSosOpen(true)} style={({ pressed }) => [styles.sosCard, pressed && styles.pressed]}><View style={styles.sosIcon}><MaterialIcons name="priority-high" size={24} color={palette.white} /></View><View style={styles.sosCopy}><Text style={styles.sosTitle}>{sosSent ? "SOS alert sent" : "Emergency SOS"}</Text><Text style={styles.sosText}>{sosSent ? "Family contact and assigned care partner notified." : "Use only if Mum needs immediate human help."}</Text></View><MaterialIcons name="arrow-forward-ios" size={16} color={palette.white} /></Pressable>
    <SectionTitle action={<Pressable onPress={() => router.push({ pathname: "/(tabs)/visits", params: { role: "client" } })}><Text style={styles.link}>See all</Text></Pressable>}>Today’s care</SectionTitle>
    <Card style={styles.timelineCard}>{clientTasks.map((task, index) => <View key={task.time} style={styles.taskRow}><View style={styles.timeCol}><Text style={styles.taskTime}>{task.time}</Text>{index < clientTasks.length - 1 && <View style={styles.timelineLine} />}</View><View style={[styles.taskDot, task.state === "done" ? styles.taskDotDone : task.state === "next" ? styles.taskDotNext : styles.taskDotUpcoming]}>{task.state === "done" ? <MaterialIcons name="check" size={13} color={palette.white} /> : null}</View><View style={styles.taskCopy}><Text style={styles.taskLabel}>{task.label}</Text><Text style={styles.taskDetail}>{task.detail}</Text></View><StatusPill label={task.state === "done" ? "Done" : task.state === "next" ? "Next" : "Later"} tone={task.state === "done" ? "good" : task.state === "next" ? "warm" : "neutral"} /></View>)}</Card>
    <MedicationReminderCard />
    <SectionTitle>Quick actions</SectionTitle>
    <View style={styles.quickGrid}><Pressable onPress={() => router.push({ pathname: "/(tabs)/visits", params: { role: "client" } })} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}><IconBadge name="event" /><Text style={styles.quickTitle}>Book care</Text><Text style={styles.quickDetail}>Arrange a visit or ride</Text></Pressable><Pressable onPress={() => router.push({ pathname: "/(tabs)/vault", params: { role: "client" } })} style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}><IconBadge name="folder-shared" color={palette.ochre} background={palette.ochreWash} /><Text style={styles.quickTitle}>Medical vault</Text><Text style={styles.quickDetail}>Reports, notes, history</Text></Pressable></View>
    <View style={styles.trackingNotice}><MaterialIcons name="location-off" size={18} color={palette.muted} /><Text style={styles.trackingText}><Text style={styles.trackingStrong}>Tracking is off.</Text> Location is shared only during an active visit with consent.</Text></View>
    <Pressable onPress={onLogout} style={styles.logoutInline}><MaterialIcons name="logout" size={16} color={palette.terracotta} /><Text style={styles.logoutText}>Sign out of this demo</Text></Pressable>
  </ScrollView><Modal transparent visible={sosOpen} animationType="fade" onRequestClose={() => setSosOpen(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalBadge}><MaterialIcons name="priority-high" size={24} color={palette.terracotta} /></View><Text style={styles.modalTitle}>Send an emergency SOS?</Text><Text style={styles.modalText}>This will notify your configured family contact and Asha’s assigned care partner. It does not contact emergency services.</Text><View style={styles.modalActions}><ActionButton variant="secondary" onPress={() => setSosOpen(false)}>Not now</ActionButton><ActionButton variant="danger" onPress={() => { setSosSent(true); setSosOpen(false); }}>Send SOS alert</ActionButton></View></View></View></Modal></ScreenContainer>;
}

function StaffHome({ onLogout }: { onLogout: () => void }) {
  const router = useRouter();
  const [checkedIn, setCheckedIn] = useState(false);
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <TopBar role="staff" />
    <View style={styles.greeting}><View><Eyebrow>Saturday, 02 November · Shift 09:30–18:00</Eyebrow><Text style={styles.pageTitle}>Your route, Ravi.</Text><Text style={styles.pageIntro}>Three visits, one steady rhythm.</Text></View><Avatar initials="RM" size={46} /></View>
    <Card style={styles.shiftCard}><View style={styles.shiftHeader}><View><Text style={styles.shiftLabel}>Next visit</Text><Text style={styles.shiftName}>Asha Sharma</Text><Text style={styles.shiftMeta}>11:30 · Companion visit</Text></View><StatusPill label={checkedIn ? "Checked in" : "0.8 km away"} tone={checkedIn ? "good" : "warm"} /></View><View style={styles.addressRow}><MaterialIcons name="place" size={16} color={palette.terracotta} /><Text style={styles.addressText}>14 Rosewood Lane, Pune</Text></View><View style={styles.shiftRule} /><Text style={styles.validationNote}>Check-in requires location permission and backend validation within 20 metres of the assigned home.</Text><ActionButton icon={checkedIn ? "task-alt" : "my-location"} onPress={() => setCheckedIn(true)} disabled={checkedIn}>{checkedIn ? "Visit checked in" : "Check in at Asha’s home"}</ActionButton></Card>
    <SectionTitle action={<Text style={styles.routeCount}>3 assigned</Text>}>Today’s route</SectionTitle>
    <Card style={styles.scheduleCard}>{staffVisits.map((visit, index) => <View key={visit.id} style={styles.scheduleRow}><View style={styles.scheduleTime}><Text style={styles.scheduleTimeText}>{visit.time}</Text><Text style={styles.scheduleDistance}>{visit.distance}</Text></View><View style={[styles.scheduleDot, index === 0 && styles.scheduleDotActive]} /><View style={styles.scheduleCopy}><Text style={styles.scheduleName}>{visit.name}</Text><Text style={styles.scheduleMeta}>{visit.service} · {visit.address}</Text></View><StatusPill label={index === 0 ? "Next" : "Scheduled"} tone={index === 0 ? "warm" : "neutral"} /></View>)}</Card>
    <View style={styles.nearbyBanner}><MaterialIcons name="near-me" size={19} color={palette.ink} /><View style={{ flex: 1 }}><Text style={styles.nearbyTitle}>Nearby view · 1 km radius</Text><Text style={styles.nearbyText}>Only visits assigned to you are shown. Client directory access is restricted.</Text></View></View>
    <ActionButton variant="secondary" icon="assignment" onPress={() => router.push({ pathname: "/(tabs)/visits", params: { role: "staff" } })}>Open active visit checklist</ActionButton>
    <Pressable onPress={onLogout} style={styles.logoutInline}><MaterialIcons name="logout" size={16} color={palette.terracotta} /><Text style={styles.logoutText}>Sign out of this demo</Text></Pressable>
  </ScrollView></ScreenContainer>;
}

export default function HomeScreen() {
  const params = useGlobalSearchParams<{ role?: string | string[] }>();
  const role = roleFromParam(params.role);
  const router = useRouter();
  return role === "staff" ? <StaffHome onLogout={() => router.replace("/")} /> : <FamilyHome onLogout={() => router.replace("/")} />;
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 36 },
  topBar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 26 },
  topBrand: { alignItems: "center", flexDirection: "row", gap: 9 },
  topBrandName: { color: palette.ink, fontFamily: "serif", fontSize: 18, fontWeight: "700" },
  topBrandSub: { color: palette.terracotta, fontSize: 9, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  bell: { alignItems: "center", backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 20, borderWidth: 1, height: 40, justifyContent: "center", width: 40 },
  bellDot: { backgroundColor: palette.terracotta, borderColor: palette.paper, borderRadius: 5, borderWidth: 2, height: 9, position: "absolute", right: 8, top: 7, width: 9 },
  greeting: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  pageTitle: { color: palette.ink, fontFamily: "serif", fontSize: 30, fontWeight: "700", letterSpacing: -0.5, marginTop: 5 },
  pageIntro: { color: palette.inkSoft, fontSize: 13, marginTop: 5 },
  profileCard: { marginBottom: 21 },
  profileTop: { alignItems: "center", flexDirection: "row", gap: 12 },
  profileDetails: { flex: 1, gap: 4 },
  profileName: { color: palette.ink, fontFamily: "serif", fontSize: 22, fontWeight: "700" },
  profileRelation: { color: palette.muted, fontSize: 11, lineHeight: 16 },
  vitalsRow: { borderTopColor: palette.line, borderTopWidth: 1, flexDirection: "row", gap: 8, marginTop: 16, paddingTop: 15 },
  vital: { flex: 1 },
  vitalLabel: { color: palette.muted, fontSize: 10, lineHeight: 14 },
  vitalValue: { color: palette.ink, fontSize: 17, fontWeight: "800", marginTop: 4 },
  vitalUnit: { color: palette.muted, fontSize: 9, fontWeight: "500" },
  vitalTime: { color: palette.sage, fontSize: 9, marginTop: 4 },
  sosCard: { alignItems: "center", backgroundColor: palette.terracotta, borderRadius: 20, flexDirection: "row", gap: 12, marginBottom: 28, padding: 15 },
  sosIcon: { alignItems: "center", backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  sosCopy: { flex: 1 },
  sosTitle: { color: palette.white, fontSize: 15, fontWeight: "800" },
  sosText: { color: "#FDE8E3", fontSize: 11, lineHeight: 16, marginTop: 3 },
  link: { color: palette.terracotta, fontSize: 12, fontWeight: "800" },
  timelineCard: { marginBottom: 25, paddingVertical: 10 },
  taskRow: { alignItems: "center", flexDirection: "row", minHeight: 66 },
  timeCol: { alignSelf: "stretch", alignItems: "center", justifyContent: "flex-start", paddingTop: 17, width: 42 },
  taskTime: { color: palette.muted, fontSize: 10, fontWeight: "800" },
  timelineLine: { backgroundColor: palette.line, flex: 1, marginTop: 6, width: 1 },
  taskDot: { alignItems: "center", borderRadius: 8, height: 16, justifyContent: "center", marginRight: 11, width: 16 },
  taskDotDone: { backgroundColor: palette.sage },
  taskDotNext: { backgroundColor: palette.terracotta },
  taskDotUpcoming: { backgroundColor: palette.line },
  taskCopy: { flex: 1 },
  taskLabel: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  taskDetail: { color: palette.muted, fontSize: 11, marginTop: 4 },
  quickGrid: { flexDirection: "row", gap: 10, marginBottom: 20 },
  quickCard: { backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 19, borderWidth: 1, flex: 1, minHeight: 128, padding: 14 },
  quickTitle: { color: palette.ink, fontSize: 14, fontWeight: "800", marginTop: 13 },
  quickDetail: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  trackingNotice: { alignItems: "flex-start", backgroundColor: "#EFECE7", borderRadius: 13, flexDirection: "row", gap: 9, marginBottom: 18, padding: 12 },
  trackingText: { color: palette.muted, flex: 1, fontSize: 11, lineHeight: 16 },
  trackingStrong: { color: palette.ink, fontWeight: "800" },
  logoutInline: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 7, padding: 8 },
  logoutText: { color: palette.terracotta, fontSize: 12, fontWeight: "800" },
  shiftCard: { marginBottom: 25 },
  shiftHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  shiftLabel: { color: palette.muted, fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  shiftName: { color: palette.ink, fontFamily: "serif", fontSize: 25, fontWeight: "700", marginTop: 5 },
  shiftMeta: { color: palette.inkSoft, fontSize: 12, marginTop: 3 },
  addressRow: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 16 },
  addressText: { color: palette.darkMuted, fontSize: 12 },
  shiftRule: { backgroundColor: palette.line, height: 1, marginVertical: 15 },
  validationNote: { color: palette.muted, fontSize: 11, lineHeight: 16, marginBottom: 14 },
  routeCount: { color: palette.muted, fontSize: 12, fontWeight: "700" },
  scheduleCard: { marginBottom: 16 },
  scheduleRow: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 66 },
  scheduleTime: { alignItems: "flex-end", width: 43 },
  scheduleTimeText: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  scheduleDistance: { color: palette.muted, fontSize: 10, marginTop: 4 },
  scheduleDot: { backgroundColor: palette.line, borderRadius: 6, height: 12, width: 12 },
  scheduleDotActive: { backgroundColor: palette.terracotta },
  scheduleCopy: { flex: 1 },
  scheduleName: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  scheduleMeta: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  nearbyBanner: { alignItems: "center", backgroundColor: palette.sageWash, borderRadius: 15, flexDirection: "row", gap: 10, marginBottom: 18, padding: 13 },
  nearbyTitle: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  nearbyText: { color: palette.darkMuted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
  modalBackdrop: { alignItems: "center", backgroundColor: "rgba(23,50,77,0.45)", flex: 1, justifyContent: "center", padding: 22 },
  modalCard: { backgroundColor: palette.paper, borderRadius: 24, padding: 22, width: "100%" },
  modalBadge: { alignItems: "center", backgroundColor: palette.terracottaWash, borderRadius: 19, height: 38, justifyContent: "center", width: 38 },
  modalTitle: { color: palette.ink, fontFamily: "serif", fontSize: 25, fontWeight: "700", marginTop: 14 },
  modalText: { color: palette.inkSoft, fontSize: 13, lineHeight: 20, marginTop: 8 },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 21 },
});
