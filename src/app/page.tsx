import { ElectionDashboard } from "@/components/election-dashboard";
import { loadElectionDataset } from "@/server/election-data";

export default async function Home() {
  const dataset = await loadElectionDataset();

  return <ElectionDashboard dataset={dataset} />;
}
