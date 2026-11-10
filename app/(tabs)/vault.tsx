import { CareScreen, EmptyStateCard, NoticeCard } from "@/components/care-screen";

export default function VaultScreen() {
  return (
    <CareScreen eyebrow="Private records" title="Medical vault" subtitle="Documents should be accessible only to verified, authorized members of your care circle.">
      <EmptyStateCard icon="folder-shared" title="No records loaded" description="The current API does not provide an authorized family-scoped document list." />
      <NoticeCard icon="lock-outline" title="No upload or download is available" description="This screen has not selected, stored or shared a document. Private vault actions require secure consent and access checks." />
    </CareScreen>
  );
}
