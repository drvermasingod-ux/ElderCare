import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ActionButton, Card, Eyebrow, FieldLabel, IconBadge, SectionTitle, StatusPill } from "@/components/care-ui";
import { familyBookings, palette, roleFromParam, visitFeed, type Role } from "@/lib/eldercare";

function VisitsHeader({ role }: { role: Role }) { return <><Eyebrow>{role === "staff" ? "Assigned work only" : "Your care timeline"}</Eyebrow><Text style={styles.pageTitle}>{role === "staff" ? "Active visit" : "Visit journal"}</Text><Text style={styles.pageIntro}>{role === "staff" ? "Complete each step before you submit." : "A shared record of the small things that matter."}</Text></>; }

function ClientVisits() {
  const router = useRouter();
  const [requested, setRequested] = useState(false);
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><VisitsHeader role="client" /><Card style={styles.bookCard}><View style={styles.bookHeading}><IconBadge name="add-circle-outline" background={palette.terracottaWash} color={palette.terracotta} size={42} /><View style={styles.flex}><Text style={styles.cardTitle}>Need a hand this week?</Text><Text style={styles.cardSub}>Request a service and we’ll share updates as it moves from request to assignment.</Text></View></View><View style={styles.serviceChips}><Text style={styles.serviceChip}>Companion</Text><Text style={styles.serviceChip}>Doctor escort</Text><Text style={styles.serviceChip}>Lab collection</Text></View><ActionButton icon="event" onPress={() => setRequested(true)}>{requested ? "Request received" : "Book a care service"}</ActionButton>{requested ? <Text style={styles.successText}>Your request is saved as “Requested”. A coordinator will confirm the time and assigned partner.</Text> : null}</Card><SectionTitle>Upcoming bookings</SectionTitle>{familyBookings.map((booking) => <Card key={booking.kind} style={styles.bookingCard}><View style={styles.bookingTop}><View style={styles.flex}><Text style={styles.bookingKind}>{booking.kind}</Text><Text style={styles.bookingWhen}>{booking.day} · {booking.when}</Text></View><StatusPill label={booking.status} tone={booking.status === "Assigned" ? "good" : "warm"} /></View><View style={styles.bookingBottom}><MaterialIcons name="person-outline" size={15} color={palette.muted} /><Text style={styles.bookingPerson}>{booking.person}</Text><MaterialIcons name="place" size={15} color={palette.muted} /><Text style={styles.bookingPerson}>Asha’s home</Text></View></Card>)}<SectionTitle>Shared visit notes</SectionTitle>{visitFeed.map((item) => <Card key={item.time} style={styles.feedCard}><View style={styles.feedTop}><StatusPill label={item.kind === "photo" ? "Photo + note" : "Care note"} tone="neutral" /><Text style={styles.feedTime}>{item.time}</Text></View><Text style={styles.feedTitle}>{item.title}</Text><Text style={styles.feedBody}>{item.body}</Text><Text style={styles.feedBy}>{item.by}</Text></Card>)}<View style={styles.privacyNote}><MaterialIcons name="lock-outline" size={17} color={palette.sage} /><Text style={styles.privacyText}>This feed is limited to linked family members and assigned care partners.</Text></View><Pressable onPress={() => router.push({ pathname: "/(tabs)/vault", params: { role: "client" } })} style={styles.textAction}><Text style={styles.textActionText}>Open medical vault</Text><MaterialIcons name="arrow-forward" size={16} color={palette.terracotta} /></Pressable></ScrollView></ScreenContainer>;
}

function StaffVisits() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bp, setBp] = useState("126 / 78");
  const [sugar, setSugar] = useState("102");
  const [notes, setNotes] = useState("");
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}><VisitsHeader role="staff" /><View style={styles.stepRow}>{["Confirm", "Measure", "Capture", "Submit"].map((step, index) => <View key={step} style={styles.stepItem}><View style={[styles.stepCircle, (checkedIn && index === 0) || submitted ? styles.stepCircleDone : index === 0 ? styles.stepCircleActive : null]}>{(checkedIn && index === 0) || submitted ? <MaterialIcons name="check" size={13} color={palette.white} /> : <Text style={[styles.stepNumber, index === 0 && styles.stepNumberActive]}>{index + 1}</Text>}</View><Text style={styles.stepLabel}>{step}</Text>{index < 3 && <View style={styles.stepLine} />}</View>)}</View><Card style={styles.assignmentCard}><View style={styles.assignmentHeader}><View><Text style={styles.assignmentEyebrow}>VIS-2048 · 11:30</Text><Text style={styles.assignmentName}>Asha Sharma</Text><Text style={styles.assignmentMeta}>Companion visit · 14 Rosewood Lane</Text></View><StatusPill label={submitted ? "Submitted" : checkedIn ? "In progress" : "Not started"} tone={submitted || checkedIn ? "good" : "warm"} /></View><View style={styles.locationCallout}><MaterialIcons name={checkedIn ? "location-on" : "my-location"} size={18} color={checkedIn ? palette.sage : palette.terracotta} /><View style={styles.flex}><Text style={styles.locationTitle}>{checkedIn ? "Checked in at 11:29" : "GPS check-in required"}</Text><Text style={styles.locationText}>{checkedIn ? "Accuracy 8 m · backend validation recorded" : "Allow location, then confirm you are within 20 metres."}</Text></View></View>{!checkedIn ? <ActionButton icon="my-location" onPress={() => setCheckedIn(true)}>Request GPS check-in</ActionButton> : <View style={styles.checkedBanner}><MaterialIcons name="verified" size={17} color={palette.sage} /><Text style={styles.checkedText}>Visit assigned to you · duplicate check-ins are blocked.</Text></View>}</Card><Text style={styles.formSection}>Visit record</Text><Card style={styles.formCard}><FieldLabel>Blood pressure · mmHg</FieldLabel><TextInput value={bp} onChangeText={setBp} keyboardType="numbers-and-punctuation" style={styles.input} editable={checkedIn && !submitted} /><FieldLabel>Blood sugar · mg/dL</FieldLabel><TextInput value={sugar} onChangeText={setSugar} keyboardType="numeric" style={styles.input} editable={checkedIn && !submitted} /><FieldLabel>Visit note</FieldLabel><TextInput value={notes} onChangeText={setNotes} placeholder="How was Asha today?" placeholderTextColor={palette.muted} multiline style={[styles.input, styles.noteInput]} editable={checkedIn && !submitted} /><View style={styles.captureRow}><Pressable disabled={!checkedIn || submitted} style={({ pressed }) => [styles.captureButton, pressed && styles.pressed]}><MaterialIcons name="add-a-photo" size={20} color={palette.ink} /><Text style={styles.captureText}>Add visit photo</Text></Pressable><Pressable disabled={!checkedIn || submitted} style={({ pressed }) => [styles.captureButton, pressed && styles.pressed]}><MaterialIcons name="description" size={20} color={palette.ink} /><Text style={styles.captureText}>Add prescription</Text></Pressable></View><Text style={styles.consentText}>Only capture or upload with consent. Files are private to this assignment and linked family.</Text><ActionButton disabled={!checkedIn || submitted} icon={submitted ? "task-alt" : "send"} onPress={() => setSubmitted(true)}>{submitted ? "Task submitted" : "Submit completed visit"}</ActionButton>{submitted ? <Text style={styles.successText}>Completed at 11:42. Earnings will appear after the trusted backend records the visit.</Text> : null}</Card><View style={styles.escalationNote}><MaterialIcons name="support-agent" size={18} color={palette.terracotta} /><Text style={styles.privacyText}>Check-in trouble? Escalate to dispatch rather than editing coordinates or completing an unassigned task.</Text></View></ScrollView></ScreenContainer>;
}

export default function VisitsScreen() { const params = useGlobalSearchParams<{ role?: string | string[] }>(); return roleFromParam(params.role) === "staff" ? <StaffVisits /> : <ClientVisits />; }

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 18, paddingTop: 24, paddingBottom: 38 },
  pageTitle: { color: palette.ink, fontFamily: "serif", fontSize: 32, fontWeight: "700", marginTop: 6 },
  pageIntro: { color: palette.inkSoft, fontSize: 13, lineHeight: 19, marginBottom: 22, marginTop: 5 },
  bookCard: { marginBottom: 25 },
  bookHeading: { alignItems: "center", flexDirection: "row", gap: 11 },
  flex: { flex: 1 },
  cardTitle: { color: palette.ink, fontFamily: "serif", fontSize: 20, fontWeight: "700" },
  cardSub: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  serviceChips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16, marginTop: 16 },
  serviceChip: { backgroundColor: palette.ivory, borderColor: palette.line, borderRadius: 99, borderWidth: 1, color: palette.darkMuted, fontSize: 10, fontWeight: "700", overflow: "hidden", paddingHorizontal: 9, paddingVertical: 7 },
  successText: { color: palette.sage, fontSize: 11, lineHeight: 16, marginTop: 11 },
  bookingCard: { marginBottom: 10, paddingVertical: 15 },
  bookingTop: { alignItems: "flex-start", flexDirection: "row" },
  bookingKind: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  bookingWhen: { color: palette.muted, fontSize: 11, marginTop: 5 },
  bookingBottom: { alignItems: "center", borderTopColor: palette.line, borderTopWidth: 1, flexDirection: "row", gap: 5, marginTop: 13, paddingTop: 11 },
  bookingPerson: { color: palette.muted, fontSize: 10, marginRight: 7 },
  feedCard: { marginBottom: 10 },
  feedTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  feedTime: { color: palette.muted, fontSize: 10 },
  feedTitle: { color: palette.ink, fontFamily: "serif", fontSize: 18, fontWeight: "700", marginTop: 13 },
  feedBody: { color: palette.inkSoft, fontSize: 12, lineHeight: 19, marginTop: 5 },
  feedBy: { color: palette.sage, fontSize: 10, fontWeight: "700", marginTop: 11 },
  privacyNote: { alignItems: "flex-start", backgroundColor: palette.sageWash, borderRadius: 14, flexDirection: "row", gap: 9, marginTop: 8, padding: 12 },
  privacyText: { color: palette.darkMuted, flex: 1, fontSize: 11, lineHeight: 16 },
  textAction: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 7, marginTop: 18, padding: 8 },
  textActionText: { color: palette.terracotta, fontSize: 12, fontWeight: "800" },
  stepRow: { flexDirection: "row", marginBottom: 20 },
  stepItem: { alignItems: "center", flex: 1, position: "relative" },
  stepCircle: { alignItems: "center", backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 12, borderWidth: 1, height: 24, justifyContent: "center", width: 24 },
  stepCircleActive: { backgroundColor: palette.terracotta, borderColor: palette.terracotta },
  stepCircleDone: { backgroundColor: palette.sage, borderColor: palette.sage },
  stepNumber: { color: palette.muted, fontSize: 10, fontWeight: "800" },
  stepNumberActive: { color: palette.white },
  stepLabel: { color: palette.muted, fontSize: 9, marginTop: 5 },
  stepLine: { backgroundColor: palette.line, height: 1, left: "62%", position: "absolute", right: "-38%", top: 12 },
  assignmentCard: { marginBottom: 22 },
  assignmentHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  assignmentEyebrow: { color: palette.terracotta, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  assignmentName: { color: palette.ink, fontFamily: "serif", fontSize: 24, fontWeight: "700", marginTop: 5 },
  assignmentMeta: { color: palette.muted, fontSize: 11, marginTop: 4 },
  locationCallout: { alignItems: "center", backgroundColor: palette.ivory, borderRadius: 13, flexDirection: "row", gap: 9, marginBottom: 14, marginTop: 17, padding: 12 },
  locationTitle: { color: palette.ink, fontSize: 12, fontWeight: "800" },
  locationText: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  checkedBanner: { alignItems: "center", backgroundColor: palette.sageWash, borderRadius: 12, flexDirection: "row", gap: 8, padding: 11 },
  checkedText: { color: palette.darkMuted, flex: 1, fontSize: 10, lineHeight: 15 },
  formSection: { color: palette.ink, fontFamily: "serif", fontSize: 21, fontWeight: "700", marginBottom: 11 },
  formCard: { marginBottom: 17 },
  input: { backgroundColor: palette.ivory, borderColor: palette.line, borderRadius: 12, borderWidth: 1, color: palette.ink, fontSize: 13, marginBottom: 15, minHeight: 45, paddingHorizontal: 12 },
  noteInput: { minHeight: 86, paddingTop: 12, textAlignVertical: "top" },
  captureRow: { flexDirection: "row", gap: 9, marginBottom: 10 },
  captureButton: { alignItems: "center", backgroundColor: palette.ochreWash, borderRadius: 13, flex: 1, gap: 6, minHeight: 68, justifyContent: "center", padding: 8 },
  captureText: { color: palette.ink, fontSize: 10, fontWeight: "800", textAlign: "center" },
  consentText: { color: palette.muted, fontSize: 10, lineHeight: 15, marginBottom: 15 },
  escalationNote: { alignItems: "flex-start", backgroundColor: palette.terracottaWash, borderRadius: 14, flexDirection: "row", gap: 9, padding: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
