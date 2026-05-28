import { cookies } from "next/headers";
import { ElectionDashboard } from "@/components/election-dashboard";
import { electionDataset } from "@/domain/generated-election-data";

export const dynamic = "force-dynamic";

const dashboardSelectionCookieName = "before-you-vote-dashboard-selection";
const dashboardSelectionRegionParamName = "region";
const dashboardSelectionAreaParamName = "area";
const dashboardSelectionElectionParamName = "election";

type DashboardSelectionCookie = {
  regionSlug?: string;
  areaId?: string;
  electionId?: string;
};

type HomeProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const [cookieStore, params] = await Promise.all([cookies(), searchParams ?? Promise.resolve({})]);
  const urlSelection = readDashboardSelectionSearchParams(params);
  const cookieSelection = readDashboardSelectionCookie(cookieStore.get(dashboardSelectionCookieName)?.value);
  const initialSelection = urlSelection ?? cookieSelection;

  return <ElectionDashboard dataset={electionDataset} initialSelection={initialSelection} />;
}

function readDashboardSelectionSearchParams(params: Record<string, string | string[] | undefined>): DashboardSelectionCookie | null {
  const regionSlug = readStringSearchParam(params[dashboardSelectionRegionParamName]);
  const areaId = readStringSearchParam(params[dashboardSelectionAreaParamName]);
  const electionId = readStringSearchParam(params[dashboardSelectionElectionParamName]);

  if (!regionSlug && !areaId && !electionId) {
    return null;
  }

  return {
    regionSlug,
    areaId,
    electionId
  };
}

function readStringSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
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
