import { FeatureUnavailable } from "@/components/feature-unavailable";

export default function HomeScreen() {
  return <FeatureUnavailable title="Care overview is unavailable" description="Your care overview will appear only after the service verifies your account, role and linked family access. No sample health values or reminder statuses are displayed." />;
}
