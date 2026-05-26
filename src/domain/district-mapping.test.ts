import { describe, expect, it } from "vitest";
import {
  filterElectionsByAdministrativeArea,
  getAdministrativeAreaOptions,
  getDistrictMappingCoverage
} from "./district-mapping";
import { getRegionBySlug, getRegionElections } from "./election";
import { electionDataset } from "./generated-election-data";

describe("district mapping", () => {
  it("keeps only common elections until an administrative area is selected", () => {
    const region = getRegionBySlug(electionDataset, "gyeonggi-hwaseong-dongtan");
    const elections = getRegionElections(electionDataset, region.id);
    const filtered = filterElectionsByAdministrativeArea(elections, null);

    expect(filtered.map((election) => election.title)).toEqual([
      "경기도지사",
      "경기도교육감",
      "화성시장",
      "경기도 광역의원 비례대표",
      "화성시 기초의원 비례대표"
    ]);
  });

  it("maps Dongtan administrative areas to one provincial and one city council district", () => {
    const region = getRegionBySlug(electionDataset, "gyeonggi-hwaseong-dongtan");
    const elections = getRegionElections(electionDataset, region.id);
    const area = getAdministrativeAreaOptions(region.slug).find((option) => option.label === "동탄1동") ?? null;
    const filtered = filterElectionsByAdministrativeArea(elections, area);

    expect(getAdministrativeAreaOptions(region.slug).length).toBeGreaterThanOrEqual(7);
    expect(filtered.map((election) => election.title)).toEqual([
      "경기도지사",
      "경기도교육감",
      "화성시장",
      "화성시제3선거구 시·도의원",
      "화성시다선거구 구·시·군의원",
      "경기도 광역의원 비례대표",
      "화성시 기초의원 비례대표"
    ]);
  });

  it("maps Mapo administrative areas without asking users to know district names", () => {
    const region = getRegionBySlug(electionDataset, "seoul-mapo-seogyo");
    const elections = getRegionElections(electionDataset, region.id);
    const area = getAdministrativeAreaOptions(region.slug).find((option) => option.label === "서교동") ?? null;
    const filtered = filterElectionsByAdministrativeArea(elections, area);

    expect(filtered.map((election) => election.title)).toEqual([
      "서울특별시장",
      "서울특별시교육감",
      "마포구청장",
      "마포구제3선거구 시·도의원",
      "마포구바선거구 구·시·군의원",
      "서울특별시 광역의원 비례대표",
      "마포구 기초의원 비례대표"
    ]);
  });

  it("maps Icheon administrative areas without direct district selection", () => {
    const region = electionDataset.regions.find((item) => item.displayName === "경기도 이천시");

    if (!region) {
      throw new Error("Missing Icheon region");
    }

    const elections = getRegionElections(electionDataset, region.id);
    const area = getAdministrativeAreaOptions(region.slug).find((option) => option.label === "중리동") ?? null;
    const filtered = filterElectionsByAdministrativeArea(elections, area);

    expect(region.slug).toBe("region-1r3f0eh");
    expect(filtered.map((election) => election.title)).toEqual([
      "경기도지사",
      "경기도교육감",
      "이천시장",
      "이천시제1선거구 시·도의원",
      "이천시나선거구 구·시·군의원",
      "경기도 광역의원 비례대표",
      "이천시 기초의원 비례대표"
    ]);
  });

  it("loads collected district mapping data instead of local hardcoded samples", () => {
    const coverage = getDistrictMappingCoverage();

    expect(coverage.mappedRegionCount).toBeGreaterThan(200);
    expect(coverage.failureCount).toBe(0);
  });
});
