import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { ActionButton, Card, Eyebrow, LogoMark } from "@/components/care-ui";
import { palette } from "@/lib/eldercare";

type Mode = "welcome" | "login" | "signup";
type AuthMethod = "phone" | "email" | "social";
type SignupRole = "parent" | "child";
type ChildLinkMethod = "direct" | "pair" | "keypad";
type ParentLinkMethod = "phone" | "invite";
type Step = "auth" | "role" | "child-profile" | "child-link" | "parent-link" | "complete";

type OnboardingState = {
  mode: Mode;
  step: Step;
  authMethod: AuthMethod;
  signupRole: SignupRole;
  childLinkMethod: ChildLinkMethod;
  parentLinkMethod: ParentLinkMethod;
  name: string;
  phone: string;
  vitals: string;
};

const DEMO_PAIR_CODE = "482731";
const DEMO_INVITE_CODE = "735204";

const initialState: OnboardingState = {
  mode: "welcome",
  step: "auth",
  authMethod: "phone",
  signupRole: "child",
  childLinkMethod: "pair",
  parentLinkMethod: "invite",
  name: "Asha Sharma",
  phone: "+91 98765 43210",
  vitals: "BP 126/78 · Sugar 102",
};

export default function EntryScreen() {
  const router = useRouter();
  const [state, setState] = useState(initialState);

  const set = <K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) => setState((current) => ({ ...current, [key]: value }));
  const go = (step: Step) => set("step", step);
  const reset = () => setState(initialState);
  const openDashboard = (persona: "parent" | "child") => router.replace({ pathname: "/(tabs)", params: { role: "client", persona } });

  const continueAuth = () => {
    if (state.mode === "login") {
      openDashboard("child");
    } else {
      go("role");
    }
  };

  const finishChildLink = () => {
    go("complete");
  };

  const finishParentLink = () => {
    go("complete");
  };

  if (state.step === "complete") {
    const childFlow = state.signupRole === "child";
    const keypad = childFlow && state.childLinkMethod === "keypad";
    const showCode = childFlow ? state.childLinkMethod === "pair" : state.parentLinkMethod === "invite";
    const code = childFlow ? DEMO_PAIR_CODE : DEMO_INVITE_CODE;
    return <CompletionScreen childFlow={childFlow} keypad={keypad} showCode={showCode} code={code} onContinue={() => openDashboard(childFlow ? "child" : "parent")} onBack={reset} />;
  }

  return (
    <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandRow}><LogoMark /><View><Text style={styles.brandName}>ElderCare</Text><Text style={styles.brandSub}>Companion</Text></View></View>
        {state.mode === "welcome" ? <Welcome onLogin={() => { set("mode", "login"); go("auth"); }} onSignup={() => { set("mode", "signup"); go("auth"); }} /> : <>
          <BackLink label="Back to start" onPress={reset} />
          {state.step === "auth" ? <AuthStep mode={state.mode} method={state.authMethod} setMethod={(value) => set("authMethod", value)} onContinue={continueAuth} /> : null}
          {state.step === "role" ? <RoleStep selected={state.signupRole} onSelect={(role) => set("signupRole", role)} onContinue={() => go(state.signupRole === "child" ? "child-profile" : "parent-link")} onBack={() => go("auth")} /> : null}
          {state.step === "child-profile" ? <ChildProfileStep name={state.name} phone={state.phone} vitals={state.vitals} setName={(value) => set("name", value)} setPhone={(value) => set("phone", value)} setVitals={(value) => set("vitals", value)} onContinue={() => go("child-link")} onBack={() => go("role")} /> : null}
          {state.step === "child-link" ? <ChildLinkStep method={state.childLinkMethod} onSelect={(value) => set("childLinkMethod", value)} onContinue={finishChildLink} onBack={() => go("child-profile")} /> : null}
          {state.step === "parent-link" ? <ParentLinkStep method={state.parentLinkMethod} code={DEMO_INVITE_CODE} onSelect={(value) => set("parentLinkMethod", value)} onContinue={finishParentLink} onBack={() => go("role")} /> : null}
        </>}
      </ScrollView>
    </ScreenContainer>
  );
}

function Welcome({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) {
  return <>
    <View style={styles.heroRule} />
    <Eyebrow>A steady hand, wherever you are</Eyebrow>
    <Text style={styles.title}>Care feels closer{"\n"}when it is coordinated.</Text>
    <Text style={styles.intro}>One calm place for an elder, a parent, and the family member who stays close from near or far.</Text>
    <Text style={styles.sectionLabel}>Begin securely</Text>
    <Card style={styles.actionCard}><View style={styles.actionHeading}><View style={[styles.iconSquare, { backgroundColor: palette.sageWash }]}><MaterialIcons name="login" size={24} color={palette.ink} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>I already have an account</Text><Text style={styles.actionText}>Login with phone OTP, email, or social sign-in.</Text></View></View><ActionButton icon="arrow-forward" onPress={onLogin}>Login</ActionButton></Card>
    <Card style={styles.actionCard}><View style={styles.actionHeading}><View style={[styles.iconSquare, { backgroundColor: palette.ochreWash }]}><MaterialIcons name="add" size={28} color={palette.ink} /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>I am new to ElderCare</Text><Text style={styles.actionText}>Create a Parent or Child account and link the family safely.</Text></View></View><ActionButton variant="secondary" icon="arrow-forward" onPress={onSignup}>Sign up</ActionButton></Card>
    <TrustNote />
  </>;
}

function AuthStep({ mode, method, setMethod, onContinue }: { mode: "login" | "signup"; method: AuthMethod; setMethod: (method: AuthMethod) => void; onContinue: () => void }) {
  return <>
    <Eyebrow>{mode === "login" ? "Welcome back" : "Secure account setup"}</Eyebrow>
    <Text style={styles.pageTitle}>{mode === "login" ? "Login to ElderCare" : "Choose how to continue"}</Text>
    <Text style={styles.pageIntro}>{mode === "login" ? "Your access is limited to the role verified for your account." : "Use a phone number, email, or a trusted social account."}</Text>
    <View style={styles.methodRow}>{(["phone", "email", "social"] as AuthMethod[]).map((item) => <Pressable key={item} onPress={() => setMethod(item)} style={[styles.methodChip, method === item && styles.methodChipActive]}><MaterialIcons name={item === "phone" ? "phone" : item === "email" ? "email" : "people"} size={17} color={method === item ? palette.white : palette.ink} /><Text style={[styles.methodText, method === item && styles.methodTextActive]}>{item === "phone" ? "Phone OTP" : item === "email" ? "Email" : "Social"}</Text></Pressable>)}</View>
    {method === "social" ? <Card style={styles.formCard}><Text style={styles.formTitle}>Continue with a trusted provider</Text><Text style={styles.formHelp}>Google or Apple sign-in will return you to the same role-protected account.</Text><ActionButton icon="people" onPress={onContinue}>Continue with social login</ActionButton></Card> : <Card style={styles.formCard}><Text style={styles.formTitle}>{method === "phone" ? "Mobile number" : "Email address"}</Text><TextInput placeholder={method === "phone" ? "+91 98765 43210" : "you@example.com"} placeholderTextColor={palette.muted} keyboardType={method === "phone" ? "phone-pad" : "email-address"} style={styles.input} /><Text style={styles.formHelp}>{method === "phone" ? "We will send a one-time code. Never share an OTP with anyone." : "We will send a secure sign-in link."}</Text><ActionButton icon={method === "phone" ? "sms" : "mark-email-read"} onPress={onContinue}>{mode === "login" ? "Send sign-in code" : "Continue"}</ActionButton></Card>}
    <TrustNote />
  </>;
}

function RoleStep({ selected, onSelect, onContinue, onBack }: { selected: SignupRole; onSelect: (role: SignupRole) => void; onContinue: () => void; onBack: () => void }) {
  return <StepShell eyebrow="Step 1 of 3" title="Who are you joining for?" intro="Your role controls what you can see. It can only be changed after a trusted support review." onBack={onBack}>
    <RoleChoice selected={selected === "parent"} icon="person" title="Parent / Senior Citizen" text="A simple home view with large actions, SOS, and daily reminder logs." onPress={() => onSelect("parent")} />
    <RoleChoice selected={selected === "child"} icon="family-restroom" title="Child / Family Member" text="A comprehensive family view for vitals, services, visits, and alerts." onPress={() => onSelect("child")} />
    <ActionButton icon="arrow-forward" onPress={onContinue}>Continue as {selected === "parent" ? "Parent" : "Child"}</ActionButton>
  </StepShell>;
}

function ChildProfileStep({ name, phone, vitals, setName, setPhone, setVitals, onContinue, onBack }: { name: string; phone: string; vitals: string; setName: (value: string) => void; setPhone: (value: string) => void; setVitals: (value: string) => void; onContinue: () => void; onBack: () => void }) {
  return <StepShell eyebrow="Step 2 of 3 · Child first" title="Add your parent’s profile" intro="Start with the details needed to keep a parent safe. You can update them after verification." onBack={onBack}>
    <Field label="Parent’s full name" value={name} onChangeText={setName} />
    <Field label="Parent’s mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
    <Field label="Basic vitals (optional)" value={vitals} onChangeText={setVitals} />
    <View style={styles.notice}><MaterialIcons name="lock" size={17} color={palette.sage} /><Text style={styles.noticeText}>Only linked family members and authorized care staff can access these details.</Text></View>
    <ActionButton icon="link" onPress={onContinue}>Choose linking method</ActionButton>
  </StepShell>;
}

function ChildLinkStep({ method, onSelect, onContinue, onBack }: { method: ChildLinkMethod; onSelect: (method: ChildLinkMethod) => void; onContinue: () => void; onBack: () => void }) {
  return <StepShell eyebrow="Step 3 of 3 · Link parent" title="How should your parent connect?" intro="Choose the safest option for the phone your parent uses every day." onBack={onBack}>
    <LinkChoice selected={method === "direct"} icon="link" title="Direct integration" text="Match the verified parent mobile number to this family account." onPress={() => onSelect("direct")} />
    <LinkChoice selected={method === "pair"} icon="key" title="Simple app install" text="Send a unique 6-digit Pair Code by SMS for your parent to enter." onPress={() => onSelect("pair")} />
    <LinkChoice selected={method === "keypad"} icon="record-voice-over" title="Keypad phone mode" text="No app required. Enable automated AI voice reminders to the parent’s SIM." onPress={() => onSelect("keypad")} />
    <ActionButton icon="arrow-forward" onPress={onContinue}>{method === "keypad" ? "Enable voice reminder mode" : method === "pair" ? "Create Pair Code" : "Link verified number"}</ActionButton>
  </StepShell>;
}

function ParentLinkStep({ method, code, onSelect, onContinue, onBack }: { method: ParentLinkMethod; code: string; onSelect: (method: ParentLinkMethod) => void; onContinue: () => void; onBack: () => void }) {
  return <StepShell eyebrow="Step 2 of 2 · Connect family" title="Connect with son or daughter" intro="Use their mobile number, or create a short invite code they can enter during sign-up." onBack={onBack}>
    <LinkChoice selected={method === "phone"} icon="phone" title="Enter child’s mobile number" text="We will send an SMS/WhatsApp invite after consent." onPress={() => onSelect("phone")} />
    <LinkChoice selected={method === "invite"} icon="key" title="Generate a 6-digit Invite Code" text="Read the code to your child or share it privately." onPress={() => onSelect("invite")} />
    {method === "phone" ? <Field label="Child’s mobile number" value="" placeholder="+91 98765 43210" keyboardType="phone-pad" /> : <View style={styles.codePreview}><Text style={styles.codeLabel}>Your invite code</Text><Text style={styles.code}>{code.slice(0, 3)} {code.slice(3)}</Text><Text style={styles.codeHelp}>Your child enters this code during sign-up. It expires after 15 minutes.</Text></View>}
    <ActionButton icon={method === "phone" ? "send" : "key"} onPress={onContinue}>{method === "phone" ? "Send family invite" : "Create invite and continue"}</ActionButton>
  </StepShell>;
}

function CompletionScreen({ childFlow, keypad, showCode, code, onContinue, onBack }: { childFlow: boolean; keypad: boolean; showCode: boolean; code: string; onContinue: () => void; onBack: () => void }) {
  return <ScreenContainer containerClassName="bg-[#F7F2EA]" safeAreaClassName="bg-[#F7F2EA]"><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.brandRow}><LogoMark /><View><Text style={styles.brandName}>ElderCare</Text><Text style={styles.brandSub}>Companion</Text></View></View>
    <View style={styles.completeMark}><MaterialIcons name="check" size={34} color={palette.white} /></View>
    <Eyebrow>Connection ready</Eyebrow>
    <Text style={styles.titleSmall}>{keypad ? "Keypad phone mode is ready." : "Your family circle is ready."}</Text>
    <Text style={styles.intro}>{keypad ? "The parent does not need the app. AI voice reminders can call the verified SIM after backend setup and consent." : childFlow ? (showCode ? "Your parent profile is safely prepared. Share the private Pair Code after the parent installs the app." : "The verified parent number is linked to your child account. Only approved family members can view the care picture.") : showCode ? "Your child can now enter the code to connect to your parent’s care circle." : "Your family invite has been sent to the child’s mobile number."}</Text>
    {keypad ? <View style={styles.voiceBanner}><MaterialIcons name="record-voice-over" size={24} color={palette.ink} /><View style={{ flex: 1 }}><Text style={styles.voiceTitle}>AI reminder calls</Text><Text style={styles.voiceText}>Consent, quiet hours, retry rules, and escalation are controlled by the backend.</Text></View></View> : showCode ? <View style={styles.codePreview}><Text style={styles.codeLabel}>{childFlow ? "Parent Pair Code" : "Child Invite Code"}</Text><Text style={styles.code}>{code.slice(0, 3)} {code.slice(3)}</Text><Text style={styles.codeHelp}>{childFlow ? "Share this privately with your parent after they install the app." : "Share this privately with your child. Do not post it publicly."}</Text></View> : <View style={styles.voiceBanner}><MaterialIcons name="check-circle" size={24} color={palette.sage} /><View style={{ flex: 1 }}><Text style={styles.voiceTitle}>Link request recorded</Text><Text style={styles.voiceText}>The trusted backend will verify the mobile number before granting access.</Text></View></View>}
    <ActionButton icon="arrow-forward" onPress={onContinue}>{childFlow ? "Open child dashboard" : "Open parent dashboard"}</ActionButton>
    <Pressable onPress={onBack} style={styles.secondaryLink}><MaterialIcons name="arrow-back" size={16} color={palette.terracotta} /><Text style={styles.secondaryLinkText}>Start over</Text></Pressable>
  </ScrollView></ScreenContainer>;
}

function StepShell({ eyebrow, title, intro, onBack, children }: { eyebrow: string; title: string; intro: string; onBack: () => void; children: ReactNode }) {
  return <>
    <BackLink label="Back" onPress={onBack} />
    <Eyebrow>{eyebrow}</Eyebrow>
    <Text style={styles.pageTitle}>{title}</Text>
    <Text style={styles.pageIntro}>{intro}</Text>
    <View style={styles.stepBody}>{children}</View>
  </>;
}

function RoleChoice({ selected, icon, title, text, onPress }: { selected: boolean; icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.choice, selected && styles.choiceSelected]}><View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}><MaterialIcons name={icon} size={23} color={selected ? palette.white : palette.ink} /></View><View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceText}>{text}</Text></View><MaterialIcons name={selected ? "radio-button-checked" : "radio-button-unchecked"} size={22} color={selected ? palette.terracotta : palette.line} /></Pressable>;
}

function LinkChoice({ selected, icon, title, text, onPress }: { selected: boolean; icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.linkChoice, selected && styles.linkChoiceSelected]}><View style={[styles.choiceIcon, selected && styles.choiceIconSelected]}><MaterialIcons name={icon} size={21} color={selected ? palette.white : palette.ink} /></View><View style={styles.choiceCopy}><Text style={styles.choiceTitle}>{title}</Text><Text style={styles.choiceText}>{text}</Text></View><MaterialIcons name={selected ? "check-circle" : "chevron-right"} size={21} color={selected ? palette.sage : palette.muted} /></Pressable>;
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText?: (value: string) => void; placeholder?: string; keyboardType?: "default" | "phone-pad" | "email-address" }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={palette.muted} keyboardType={keyboardType} style={styles.input} /></View>;
}

function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.backLink}><MaterialIcons name="arrow-back" size={16} color={palette.terracotta} /><Text style={styles.backText}>{label}</Text></Pressable>;
}

function TrustNote() {
  return <View style={styles.trustRow}><MaterialIcons name="verified-user" size={17} color={palette.sage} /><Text style={styles.trustText}>Role-based access · sensitive actions require confirmation</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 42 },
  brandRow: { alignItems: "center", flexDirection: "row", gap: 11, marginBottom: 26 },
  brandName: { color: palette.ink, fontFamily: "serif", fontSize: 25, fontWeight: "700", letterSpacing: -0.3 },
  brandSub: { color: palette.terracotta, fontSize: 10, fontWeight: "800", letterSpacing: 2.2, textTransform: "uppercase" },
  heroRule: { backgroundColor: palette.ink, height: 2, marginBottom: 25, opacity: 0.9, width: 42 },
  title: { color: palette.ink, fontFamily: "serif", fontSize: 38, fontWeight: "700", letterSpacing: -0.8, lineHeight: 43, marginTop: 10 },
  titleSmall: { color: palette.ink, fontFamily: "serif", fontSize: 32, fontWeight: "700", lineHeight: 38, marginTop: 10 },
  intro: { color: palette.inkSoft, fontSize: 15, lineHeight: 24, marginTop: 14, maxWidth: 350 },
  sectionLabel: { color: palette.ink, fontSize: 13, fontWeight: "800", marginBottom: 10, marginTop: 34 },
  actionCard: { gap: 16, marginBottom: 12 },
  actionHeading: { alignItems: "center", flexDirection: "row", gap: 12 },
  iconSquare: { alignItems: "center", borderRadius: 16, height: 48, justifyContent: "center", width: 48 },
  actionCopy: { flex: 1 },
  actionTitle: { color: palette.ink, fontSize: 17, fontWeight: "800" },
  actionText: { color: palette.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  backLink: { alignItems: "center", alignSelf: "flex-start", flexDirection: "row", gap: 6, marginBottom: 23, paddingVertical: 4 },
  backText: { color: palette.terracotta, fontSize: 12, fontWeight: "800" },
  pageTitle: { color: palette.ink, fontFamily: "serif", fontSize: 32, fontWeight: "700", lineHeight: 38, marginTop: 7 },
  pageIntro: { color: palette.inkSoft, fontSize: 14, lineHeight: 21, marginTop: 8 },
  methodRow: { flexDirection: "row", gap: 7, marginTop: 22 },
  methodChip: { alignItems: "center", backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 14, borderWidth: 1, flex: 1, gap: 4, paddingHorizontal: 4, paddingVertical: 10 },
  methodChipActive: { backgroundColor: palette.ink, borderColor: palette.ink },
  methodText: { color: palette.ink, fontSize: 10, fontWeight: "800" },
  methodTextActive: { color: palette.white },
  formCard: { gap: 12, marginTop: 15 },
  formTitle: { color: palette.ink, fontSize: 16, fontWeight: "800" },
  formHelp: { color: palette.muted, fontSize: 11, lineHeight: 17 },
  input: { backgroundColor: palette.ivory, borderColor: palette.line, borderRadius: 13, borderWidth: 1, color: palette.ink, fontSize: 15, minHeight: 50, paddingHorizontal: 13 },
  trustRow: { alignItems: "center", flexDirection: "row", gap: 8, marginTop: 20 },
  trustText: { color: palette.darkMuted, flex: 1, fontSize: 11, lineHeight: 16 },
  stepBody: { gap: 12, marginTop: 24 },
  choice: { alignItems: "center", backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, padding: 13 },
  choiceSelected: { backgroundColor: "#F9EFEA", borderColor: palette.terracotta },
  choiceIcon: { alignItems: "center", backgroundColor: palette.sageWash, borderRadius: 15, height: 44, justifyContent: "center", width: 44 },
  choiceIconSelected: { backgroundColor: palette.terracotta },
  choiceCopy: { flex: 1 },
  choiceTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  choiceText: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  linkChoice: { alignItems: "center", backgroundColor: palette.paper, borderColor: palette.line, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, padding: 13 },
  linkChoiceSelected: { borderColor: palette.sage, backgroundColor: palette.sageWash },
  field: { gap: 7 },
  fieldLabel: { color: palette.darkMuted, fontSize: 12, fontWeight: "700" },
  notice: { alignItems: "flex-start", backgroundColor: palette.sageWash, borderRadius: 14, flexDirection: "row", gap: 9, padding: 12 },
  noticeText: { color: palette.darkMuted, flex: 1, fontSize: 11, lineHeight: 16 },
  codePreview: { alignItems: "center", backgroundColor: palette.ochreWash, borderColor: "#E9D7AC", borderRadius: 18, borderWidth: 1, marginTop: 2, padding: 18 },
  codeLabel: { color: palette.ochre, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  code: { color: palette.ink, fontSize: 34, fontWeight: "900", letterSpacing: 5, marginTop: 5 },
  codeHelp: { color: palette.darkMuted, fontSize: 11, lineHeight: 16, marginTop: 8, textAlign: "center" },
  completeMark: { alignItems: "center", backgroundColor: palette.sage, borderRadius: 28, height: 56, justifyContent: "center", marginTop: 12, width: 56 },
  voiceBanner: { alignItems: "center", backgroundColor: palette.sageWash, borderRadius: 16, flexDirection: "row", gap: 11, marginTop: 20, padding: 14 },
  voiceTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  voiceText: { color: palette.darkMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  secondaryLink: { alignItems: "center", alignSelf: "center", flexDirection: "row", gap: 6, marginTop: 18, padding: 8 },
  secondaryLinkText: { color: palette.terracotta, fontSize: 12, fontWeight: "800" },
});
