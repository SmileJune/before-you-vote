import { districtMappingDataset } from "./generated-district-mappings";
import type { Election } from "./types";

export type DistrictMappingDataset = {
  fetchedAt: string;
  source: string;
  regions: Record<string, RegionDistrictMapping>;
  failures: Array<{
    site?: string;
    committee?: string;
    url?: string;
    reason: string;
  }>;
};

export type RegionDistrictMapping = {
  regionSlug: string;
  sourceLabel: string;
  sourceUrl: string;
  areas: AdministrativeAreaOption[];
};

export type AdministrativeAreaOption = {
  id: string;
  label: string;
  sourceLabel: string;
  sourceUrl: string;
  districtNames: string[];
};

const districtRequiredCategories = new Set(["시·도의회의원", "구·시·군의회의원"]);

export function getAdministrativeAreaOptions(regionSlug: string) {
  return districtMappingDataset.regions[regionSlug]?.areas ?? [];
}

export function getAdministrativeAreaOption(regionSlug: string, areaId: string) {
  return getAdministrativeAreaOptions(regionSlug).find((option) => option.id === areaId) ?? null;
}

export function filterElectionsByAdministrativeArea(elections: Election[], area: AdministrativeAreaOption | null) {
  return elections.filter(
    (election) =>
      !districtRequiredCategories.has(election.category) ||
      Boolean(area?.districtNames.includes(election.districtName))
  );
}

export function getDistrictMappingCoverage() {
  return {
    fetchedAt: districtMappingDataset.fetchedAt,
    mappedRegionCount: Object.keys(districtMappingDataset.regions).length,
    failureCount: districtMappingDataset.failures.length
  };
}
