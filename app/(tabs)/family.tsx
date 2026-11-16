import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { ActionButton, Card, StatusPill } from "@/components/care-ui";
import { CareScreen, EmptyStateCard, NoticeCard } from "@/components/care-screen";
import * as Api from "@/lib/_core/api";
import { ApiError } from "@/lib/_core/api";
import { FAMILY_INVITE_TTL_HOURS, FAMILY_LINK_CONSENT_VERSION, isE164Phone, isFamilyInviteCode, type FamilyLinkRecord } from "@/shared/firebase-family";
import { palette } from "@/lib/eldercare";

function readableError(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : "ElderCare could not complete this request.";
}

function ConsentToggle({ checked, onPress, label, accessibilityLabel }: {
  checked: boolean;
  onPress: () => void;
  label: string;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={styles.consentRow}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>
      <Text style={styles.consentText}>{label}</Text>
    </Pressable>
  );
}

export default function FamilyScreen() {
  const [links, setLinks] = useState<FamilyLinkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [invitePermissionConsent, setInvitePermissionConsent] = useState(false);
  const [relationshipConsent, setRelationshipConsent] = useState(false);
  const [acceptConsent, setAcceptConsent] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [issuedInvite, setIssuedInvite] = useState<{ code: string; expiresAt: string; recipientRole: "parent" | "child" } | null>(null);

  const refreshLinks = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setLinks(await Api.getFamilyLinks());
    } catch (requestError) {
      setLinks([]);
      setError(readableError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Api.getFamilyLinks().then((result) => {
      if (active) setLinks(result);
    }).catch((requestError: unknown) => {
      if (active) setError(readableError(requestError));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const issueInvite = async () => {
    if (!isE164Phone(recipientPhone.trim())) {
      setError("Recipient phone number must use international format, such as +14155550123.");
      return;
    }
    if (!invitePermissionConsent || !relationshipConsent) {
      setError("Confirm permission to use this phone number and your agreement to create the family link if they accept.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    setIssuedInvite(null);
    try {
      const invite = await Api.createFamilyInvite({
        recipientPhone: recipientPhone.trim(),
        permissionConsent: true,
        relationshipConsent: true,
        consentVersion: FAMILY_LINK_CONSENT_VERSION,
      });
      setIssuedInvite(invite);
      setNotice(`Invitation created for a ${invite.recipientRole === "child" ? "Child/Family Member" : "Parent"} account. It expires in ${FAMILY_INVITE_TTL_HOURS} hours.`);
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const acceptInvite = async () => {
    const code = inviteCodeInput.trim();
    if (!isFamilyInviteCode(code)) {
      setError("Enter the invitation code you received.");
      return;
    }
    if (!acceptConsent) {
      setError("Please review and accept the family-link consent before continuing.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await Api.acceptFamilyInvite({
        code,
        consent: true,
        consentVersion: FAMILY_LINK_CONSENT_VERSION,
      });
      setInviteCodeInput("");
      setAcceptConsent(false);
      setNotice(result.alreadyLinked
        ? `You are already linked with ${result.relationship.displayName}. No care records were shared.`
        : `You are now linked with ${result.relationship.displayName}. No care records were shared.`);
      await refreshLinks();
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    if (!issuedInvite) return;
    try {
      await Share.share({
        message: `ElderCare family invitation code: ${issuedInvite.code}\nIt expires ${new Date(issuedInvite.expiresAt).toLocaleString()}. Only the invited person with the matching verified phone number and correct Parent/Child role can accept it.`,
      });
    } catch {
      setError("Could not open the share sheet. You can share the displayed code yourself.");
    }
  };

  return (
    <CareScreen eyebrow="Care circle" title="Family and caregivers" subtitle="Connect only after each person confirms their identity and agrees.">
      {error ? <Card style={styles.errorCard}><Text accessibilityRole="alert" style={styles.errorText}>{error}</Text></Card> : null}
      {notice ? <Card style={styles.noticeCard}><Text style={styles.noticeText}>{notice}</Text></Card> : null}

      <Card style={styles.familyCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Connected family</Text>
          <StatusPill label={loading ? "CHECKING" : error ? "UNAVAILABLE" : `${links.length} LINKED`} tone={error ? "alert" : links.length ? "good" : "neutral"} />
        </View>
        {loading ? <View style={styles.loadingRow}><ActivityIndicator color={palette.primary} /><Text style={styles.muted}>Loading links securely…</Text></View> : null}
        {!loading && links.length === 0 ? (
          <EmptyStateCard icon="people-outline" title="No family links yet" description="Create an invitation for a verified phone number, or accept a code sent to your verified number." style={styles.nestedEmpty} />
        ) : null}
        {links.map((link) => (
          <View key={link.id} style={styles.linkRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{link.displayName.trim().slice(0, 1).toLocaleUpperCase()}</Text></View>
            <View style={styles.linkTextWrap}>
              <Text style={styles.linkName}>{link.displayName}</Text>
              <Text style={styles.muted}>{link.role === "parent" ? "Parent" : "Child / Family Member"} · linked {new Date(link.linkedAt).toLocaleDateString()}</Text>
            </View>
            <StatusPill label="LINKED" tone="good" />
          </View>
        ))}
        <Text style={styles.privacyNote}>A family link records the relationship only. It does not grant access to medical, medication, location, or other care records.</Text>
      </Card>

      <Card style={styles.familyCard}>
        <Text style={styles.sectionTitle}>Invite a family member</Text>
        <Text style={styles.bodyText}>Enter their phone number in international format. The invitation can only be accepted by a verified account using that same phone number and the other family role.</Text>
        <Text style={styles.fieldLabel}>Recipient’s verified phone number</Text>
        <TextInput
          accessibilityLabel="Recipient phone number in international format"
          autoComplete="tel"
          keyboardType="phone-pad"
          maxLength={16}
          onChangeText={(value) => {
            setRecipientPhone(value);
            setIssuedInvite(null);
          }}
          placeholder="+14155550123"
          placeholderTextColor={palette.muted}
          style={styles.input}
          textContentType="telephoneNumber"
          value={recipientPhone}
        />
        <ConsentToggle
          checked={invitePermissionConsent}
          onPress={() => setInvitePermissionConsent((current) => !current)}
          accessibilityLabel="I have permission to use this person's number to send an invitation"
          label="I have permission to use this person’s phone number to send them an invitation."
        />
        <ConsentToggle
          checked={relationshipConsent}
          onPress={() => setRelationshipConsent((current) => !current)}
          accessibilityLabel="I agree to create this family relationship if the invited person accepts; this does not share care records"
          label="I agree to create the family relationship if they accept. This alone will not share care records."
        />
        <ActionButton disabled={busy || !invitePermissionConsent || !relationshipConsent} icon="person-add-alt-1" onPress={issueInvite}>
          {busy ? "Please wait…" : "Create secure invitation"}
        </ActionButton>
        {issuedInvite ? (
          <View style={styles.inviteBox}>
            <Text style={styles.inviteLabel}>Share this one-time code with the intended recipient</Text>
            <Text selectable style={styles.inviteCode}>{issuedInvite.code}</Text>
            <Text style={styles.muted}>Expires: {new Date(issuedInvite.expiresAt).toLocaleString()}</Text>
            <ActionButton icon="share" onPress={shareInvite} variant="secondary">Share code</ActionButton>
          </View>
        ) : null}
      </Card>

      <Card style={styles.familyCard}>
        <Text style={styles.sectionTitle}>Accept an invitation</Text>
        <Text style={styles.bodyText}>Sign in to the Parent or Child account whose verified phone number was invited. Codes are single-use and expire after {FAMILY_INVITE_TTL_HOURS} hours.</Text>
        <Text style={styles.fieldLabel}>Invitation code</Text>
        <TextInput
          accessibilityLabel="ElderCare family invitation code"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setInviteCodeInput}
          placeholder="Paste invitation code"
          placeholderTextColor={palette.muted}
          style={styles.input}
          value={inviteCodeInput}
        />
        <ConsentToggle
          checked={acceptConsent}
          onPress={() => setAcceptConsent((current) => !current)}
          accessibilityLabel="I agree to create a family relationship; this does not grant access to care records"
          label="I agree to create this family relationship. This does not grant access to medical or care records."
        />
        <ActionButton disabled={busy || !acceptConsent} icon="verified-user" onPress={acceptInvite}>
          {busy ? "Please wait…" : "Accept invitation"}
        </ActionButton>
      </Card>

      <NoticeCard icon="verified-user" title="Your choice stays yours" description="Both people must have active Parent/Child accounts and matching verified phone details. Care information remains unavailable until separate sharing permissions are designed and implemented." />
    </CareScreen>
  );
}

const styles = StyleSheet.create({
  familyCard: { gap: 12 },
  sectionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  sectionTitle: { color: palette.ink, fontSize: 17, fontWeight: "900" },
  nestedEmpty: { backgroundColor: "#F8FCFE", borderStyle: "dashed", elevation: 0, shadowOpacity: 0 },
  bodyText: { color: palette.darkMuted, fontSize: 13, lineHeight: 19 },
  fieldLabel: { color: palette.darkMuted, fontSize: 12, fontWeight: "800", marginBottom: -5 },
  input: { backgroundColor: "#F9FCFD", borderColor: palette.line, borderRadius: 14, borderWidth: 1, color: palette.ink, fontSize: 16, minHeight: 52, paddingHorizontal: 14 },
  consentRow: { alignItems: "flex-start", flexDirection: "row", gap: 11, paddingVertical: 5 },
  checkbox: { alignItems: "center", backgroundColor: palette.white, borderColor: palette.muted, borderRadius: 5, borderWidth: 1.5, height: 24, justifyContent: "center", marginTop: 1, width: 24 },
  checkboxChecked: { backgroundColor: palette.primary, borderColor: palette.primary },
  checkmark: { color: palette.white, fontSize: 16, fontWeight: "900", lineHeight: 19 },
  consentText: { color: palette.ink, flex: 1, fontSize: 13, lineHeight: 19 },
  privacyNote: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  errorCard: { backgroundColor: "#FFF7F5", borderColor: "#F0C8BF" },
  errorText: { color: palette.terracotta, fontSize: 13, lineHeight: 19 },
  noticeCard: { backgroundColor: "#F1FAF9", borderColor: "#C6E8E4" },
  noticeText: { color: palette.primaryDark, fontSize: 13, lineHeight: 19 },
  loadingRow: { alignItems: "center", flexDirection: "row", gap: 10, paddingVertical: 8 },
  muted: { color: palette.muted, fontSize: 12, lineHeight: 18 },
  linkRow: { alignItems: "center", backgroundColor: "#F8FCFE", borderColor: palette.line, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 10, padding: 12 },
  avatar: { alignItems: "center", backgroundColor: palette.primaryWash, borderRadius: 18, height: 38, justifyContent: "center", width: 38 },
  avatarText: { color: palette.primaryDark, fontSize: 16, fontWeight: "900" },
  linkTextWrap: { flex: 1, gap: 2 },
  linkName: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  inviteBox: { backgroundColor: "#F1FAF9", borderColor: "#B8DFDB", borderRadius: 16, borderWidth: 1, gap: 10, padding: 14 },
  inviteLabel: { color: palette.primaryDark, fontSize: 13, fontWeight: "800", lineHeight: 19 },
  inviteCode: { color: palette.ink, fontFamily: "monospace", fontSize: 15, fontWeight: "900", letterSpacing: 0.6 },
});
