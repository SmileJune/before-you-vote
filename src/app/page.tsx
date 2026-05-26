import { cookies } from "next/headers";
import { ElectionDashboard } from "@/components/election-dashboard";
import { electionDataset } from "@/domain/generated-election-data";

const dashboardSelectionCookieName = "before-you-vote-dashboard-selection";

type DashboardSelectionCookie = {
  regionSlug?: string;
  areaId?: string;
  electionId?: string;
};

export default async function Home() {
  const cookieStore = await cookies();
  const initialSelection = readDashboardSelectionCookie(cookieStore.get(dashboardSelectionCookieName)?.value);

  return <ElectionDashboard dataset={electionDataset} initialSelection={initialSelection} />;
}

function readDashboardSelectionCookie(value: string | undefined): DashboardSelectionCookie | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as DashboardSelectionCookie;

    return {
      regionSlug: parsed.regionSlug,
      areaId: parsed.areaId,
      electionId: parsed.electionId
    };
  } catch {
    return null;
  }
}
