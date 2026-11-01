export type Role = "client" | "staff";

export const palette = {
  ivory: "#F7F2EA",
  paper: "#FFFCF8",
  ink: "#17324D",
  inkSoft: "#466176",
  terracotta: "#D4513D",
  terracottaWash: "#F8E4DE",
  sage: "#8FA68D",
  sageWash: "#EAF0E7",
  ochre: "#C68A35",
  ochreWash: "#F7EFD9",
  line: "#E7DDD0",
  white: "#FFFFFF",
  muted: "#76838A",
  darkMuted: "#53636D",
};

export const familyProfile = {
  name: "Asha Sharma",
  relation: "Mum · 78 years",
  initials: "AS",
  address: "14 Rosewood Lane, Pune",
  plan: "Steady Home Care",
  vitals: [
    { label: "Blood pressure", value: "126 / 78", unit: "mmHg", time: "09:12", source: "staff visit" },
    { label: "Blood sugar", value: "102", unit: "mg/dL", time: "09:14", source: "staff visit" },
    { label: "Oxygen", value: "98", unit: "%", time: "09:15", source: "staff visit" },
  ],
};

export const clientTasks = [
  { time: "08:00", label: "Morning medicines", detail: "Blood pressure + breakfast", state: "done" as const },
  { time: "11:30", label: "Companion visit", detail: "Ravi is arriving · 45 min", state: "next" as const },
  { time: "18:30", label: "Evening medicines", detail: "Amlodipine + Vitamin D", state: "upcoming" as const },
];

export const familyBookings = [
  { kind: "Companion visit", day: "Today", when: "11:30 – 12:15", status: "Assigned", person: "Ravi Menon" },
  { kind: "Home lab collection", day: "Wed, 06 Nov", when: "08:00 – 09:00", status: "Requested", person: "Awaiting assignment" },
];

export const staffVisits = [
  { id: "VIS-2048", name: "Asha Sharma", address: "14 Rosewood Lane", time: "11:30", service: "Companion visit", status: "Next", distance: "0.8 km" },
  { id: "VIS-2052", name: "Devika Iyer", address: "8 Banyan Court", time: "14:00", service: "Medication support", status: "Scheduled", distance: "1.0 km" },
  { id: "VIS-2061", name: "Arun Rao", address: "3 Lotus View", time: "16:30", service: "Doctor escort", status: "Scheduled", distance: "1.7 km" },
];

export const visitFeed = [
  { time: "Today · 09:16", title: "Morning check completed", body: "Asha was comfortable after breakfast. She took her medicines with water.", by: "Ravi Menon · care partner", kind: "note" },
  { time: "Yesterday · 18:44", title: "Evening photo shared", body: "Prescription pack checked against the evening list.", by: "Ravi Menon · care partner", kind: "photo" },
];

export const medicalDocuments = [
  { title: "Prescription · Dr. Kulkarni", meta: "Updated 02 Nov 2026 · PDF", kind: "Prescription" },
  { title: "Lipid profile report", meta: "Uploaded 28 Oct 2026 · PDF", kind: "Lab report" },
  { title: "Care history · 2026", meta: "8 visits · 3 notes", kind: "History" },
];

export const completedVisits = [
  { day: "02 Nov", person: "Asha Sharma", service: "Morning companion", amount: "₹420" },
  { day: "01 Nov", person: "Devika Iyer", service: "Medication support", amount: "₹380" },
  { day: "31 Oct", person: "Arun Rao", service: "Doctor escort", amount: "₹650" },
];

export function roleFromParam(value: string | string[] | undefined): Role {
  return value === "staff" ? "staff" : "client";
}
