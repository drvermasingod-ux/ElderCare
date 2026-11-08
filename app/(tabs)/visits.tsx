import { FeatureUnavailable } from "@/components/feature-unavailable";

export default function VisitsScreen() {
  return <FeatureUnavailable title="Visits are unavailable" description="Bookings, staff assignments and visit records are not connected to an authorized care API yet. No visit can be requested or marked complete from this screen." />;
}
