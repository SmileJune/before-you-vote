import { ElectionDashboard } from "@/components/election-dashboard";
import { electionDataset } from "@/domain/generated-election-data";

export default function Home() {
  return <ElectionDashboard dataset={electionDataset} />;
}
