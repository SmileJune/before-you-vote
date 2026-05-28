import { ElectionDashboard } from "@/components/election-dashboard";
import { electionDataset } from "@/domain/generated-election-data";

const dashboardDataset = {
  regions: electionDataset.regions,
  elections: electionDataset.elections
};

export default function Home() {
  return <ElectionDashboard dataset={dashboardDataset} />;
}
