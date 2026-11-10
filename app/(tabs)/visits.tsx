import { CareScreen, EmptyStateCard, NoticeCard } from "@/components/care-screen";

export default function VisitsScreen() {
  return (
    <CareScreen eyebrow="Care visits" title="Visits and bookings" subtitle="Appointments and staff visits appear only after the service confirms them.">
      <EmptyStateCard icon="event-note" title="No visit data loaded" description="There are no booking or visit records available from an authorized care API in this build." />
      <NoticeCard icon="info-outline" title="No booking has been made" description="This screen cannot request, reschedule or mark a visit complete until server-backed booking is available." />
    </CareScreen>
  );
}
