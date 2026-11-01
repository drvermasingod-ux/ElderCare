import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ActionButton, Card, Eyebrow, IconBadge, SectionTitle, StatusPill } from "@/components/care-ui";
import { completedVisits, familyProfile, medicalDocuments, palette, roleFromParam } from "@/lib/eldercare";

function ClientVault() {
  const [uploaded, setUploaded] = useState(false);
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Eyebrow>Private to your family circle</Eyebrow><Text style={styles.pageTitle}>Medical vault</Text><Text style={styles.pageIntro}>A calm, access-controlled place for Asha’s records and care history.</Text><Card style={styles.planCard}><View style={styles.planTop}><View><Text style={styles.planLabel}>Current care plan</Text><Text style={styles.planName}>{familyProfile.plan}</Text><Text style={styles.planMeta}>Renews 02 December 2026</Text></View><StatusPill label="Active" tone="good" /></View><View style={styles.planBottom}><View><Text style={styles.planSmall}>Visits remaining</Text><Text style={styles.planValue}>8 this month</Text></View><View><Text style={styles.planSmall}>Payment</Text><Text style={styles.planValue}>•••• 4821</Text></View><MaterialIcons name="arrow-forward-ios" size={15} color={palette.muted} /></View></Card><SectionTitle action={<Pressable onPress={() => setUploaded(true)}><Text style={styles.link}>Upload</Text></Pressable>}>Documents</SectionTitle>{medicalDocuments.map((doc) => <Pressable key={doc.title} style={({ pressed }) => [styles.docRow, pressed && styles.pressed]}><IconBadge name={doc.kind === "Prescription" ? "medication" : doc.kind === "Lab report" ? "science" : "history"} color={doc.kind === "Lab report" ? palette.ochre : palette.ink} background={doc.kind === "Lab report" ? palette.ochreWash : palette.sageWash} size={42} /><View style={styles.flex}><Text style={styles.docTitle}>{doc.title}</Text><Text style={styles.docMeta}>{doc.meta}</Text></View><MaterialIcons name="download" size={19} color={palette.muted} /></Pressable>)}{uploaded ? <Text style={styles.successText}>Upload flow ready — file type and size validation will run before secure Storage upload.</Text> : null}<SectionTitle>Access & privacy</SectionTitle><Card style={styles.privacyCard}><View style={styles.privacyRow}><MaterialIcons name="lock" size={17} color={palette.sage} /><Text style={styles.privacyText}>Only linked family members and relevant assigned staff can access these records.</Text></View><View style={styles.privacyRow}><MaterialIcons name="delete-outline" size={17} color={palette.muted} /><Text style={styles.privacyText}>Deletion and retention depend on consent, care obligations, and local policy review.</Text></View></Card><ActionButton variant="secondary" icon="support-agent" onPress={() => {}}>Contact support</ActionButton></ScrollView></ScreenContainer>;
}

function StaffVault() {
  const router = useRouter();
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><Eyebrow>Verified activity only</Eyebrow><Text style={styles.pageTitle}>Your earnings</Text><Text style={styles.pageIntro}>A simple view of completed visits recorded by the care platform.</Text><Card style={styles.earningsCard}><Text style={styles.earningsLabel}>November to date</Text><Text style={styles.earningsValue}>₹8,420</Text><View style={styles.earningsRow}><View><Text style={styles.earningsSmall}>Completed</Text><Text style={styles.earningsMetric}>21 visits</Text></View><View><Text style={styles.earningsSmall}>Pending payout</Text><Text style={styles.earningsMetric}>₹2,180</Text></View><MaterialIcons name="trending-up" size={25} color={palette.sage} /></View></Card><SectionTitle>Recent completed visits</SectionTitle>{completedVisits.map((visit) => <Card key={visit.day + visit.person} style={styles.completedRow}><View style={styles.completedDay}><Text style={styles.completedDayText}>{visit.day}</Text><View style={styles.completedMark}><MaterialIcons name="check" size={12} color={palette.white} /></View></View><View style={styles.flex}><Text style={styles.docTitle}>{visit.person}</Text><Text style={styles.docMeta}>{visit.service}</Text></View><Text style={styles.amount}>{visit.amount}</Text></Card>)}<View style={styles.backendNote}><MaterialIcons name="verified-user" size={18} color={palette.sage} /><Text style={styles.privacyText}>Earnings are calculated from authorized, submitted visits. Editing a client-side value cannot change the ledger.</Text></View><ActionButton variant="secondary" icon="assignment" onPress={() => router.push({ pathname: "/(tabs)/visits", params: { role: "staff" } })}>Review today’s checklist</ActionButton></ScrollView></ScreenContainer>;
}

export default function VaultScreen() { const params = useGlobalSearchParams<{ role?: string | string[] }>(); return roleFromParam(params.role) === "staff" ? <StaffVault /> : <ClientVault />; }

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 38 },
  pageTitle: { color: palette.ink, fontFamily: "serif", fontSize: 32, fontWeight: "700", marginTop: 6 },
  pageIntro: { color: palette.inkSoft, fontSize: 13, lineHeight: 19, marginBottom: 22, marginTop: 5 },
  planCard: { backgroundColor: palette.ink, borderRadius: 21, marginBottom: 27, padding: 17 },
  planTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  planLabel: { color: "#AFC0C8", fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" },
  planName: { color: palette.white, fontFamily: "serif", fontSize: 24, fontWeight: "700", marginTop: 5 },
  planMeta: { color: "#C7D1D3", fontSize: 11, marginTop: 4 },
  planBottom: { alignItems: "flex-end", borderTopColor: "rgba(255,255,255,0.16)", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 17, paddingTop: 14 },
  planSmall: { color: "#AFC0C8", fontSize: 10 },
  planValue: { color: palette.white, fontSize: 13, fontWeight: "800", marginTop: 4 },
  link: { color: palette.terracotta, fontSize: 12, fontWeight: "800" },
  docRow: { alignItems: "center", backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 17, borderWidth: 1, flexDirection: "row", gap: 11, marginBottom: 9, padding: 12 },
  flex: { flex: 1 },
  docTitle: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  docMeta: { color: palette.muted, fontSize: 10, marginTop: 4 },
  successText: { color: palette.sage, fontSize: 11, lineHeight: 16, marginBottom: 20, marginTop: 2 },
  privacyCard: { marginBottom: 17 },
  privacyRow: { alignItems: "flex-start", flexDirection: "row", gap: 9, marginBottom: 12 },
  privacyText: { color: palette.darkMuted, flex: 1, fontSize: 11, lineHeight: 16 },
  earningsCard: { backgroundColor: palette.ink, borderRadius: 21, marginBottom: 27, padding: 18 },
  earningsLabel: { color: "#AFC0C8", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  earningsValue: { color: palette.white, fontFamily: "serif", fontSize: 38, fontWeight: "700", marginTop: 7 },
  earningsRow: { alignItems: "flex-end", borderTopColor: "rgba(255,255,255,0.16)", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", marginTop: 15, paddingTop: 14 },
  earningsSmall: { color: "#AFC0C8", fontSize: 10 },
  earningsMetric: { color: palette.white, fontSize: 13, fontWeight: "800", marginTop: 4 },
  completedRow: { alignItems: "center", flexDirection: "row", gap: 11, marginBottom: 9, padding: 13 },
  completedDay: { alignItems: "center", gap: 6, width: 41 },
  completedDayText: { color: palette.ink, fontSize: 11, fontWeight: "800" },
  completedMark: { alignItems: "center", backgroundColor: palette.sage, borderRadius: 8, height: 17, justifyContent: "center", width: 17 },
  amount: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  backendNote: { alignItems: "flex-start", backgroundColor: palette.sageWash, borderRadius: 14, flexDirection: "row", gap: 9, marginBottom: 18, marginTop: 9, padding: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
