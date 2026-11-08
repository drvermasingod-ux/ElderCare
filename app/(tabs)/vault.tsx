import { FeatureUnavailable } from "@/components/feature-unavailable";

export default function VaultScreen() {
  return <FeatureUnavailable title="Medical vault is unavailable" description="Private document records and ownership-checked R2 access are not available from the current API. No sample files are shown and no upload or download is simulated." />;
}
