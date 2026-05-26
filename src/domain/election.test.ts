import { describe, expect, it } from "vitest";
import {
  buildCandidateComparison,
  getCandidateQuickFacts,
  getElectionDetail,
  getRegionBySlug,
  getRegionElections
} from "./election";
import { electionDataset } from "./generated-election-data";
import type { Election } from "./types";

function findElectionByTitle(regionElections: Election[], title: string) {
  const election = regionElections.find((item) => item.title === title);

  if (!election) {
    throw new Error(`Missing election title in test dataset: ${title}`);
  }

  return election;
}

describe("election domain", () => {
  it("finds a region by slug and returns only elections for that region", () => {
    const region = getRegionBySlug(electionDataset, "seoul-mapo-seogyo");
    const elections = getRegionElections(electionDataset, region.id);

    expect(region.displayName).toBe("서울특별시 마포구");
    expect(elections.map((election) => election.title)).toEqual(expect.arrayContaining([
      "서울특별시장",
      "서울특별시교육감",
      "마포구청장",
      "서울특별시 광역의원 비례대표",
      "마포구 기초의원 비례대표"
    ]));
    expect(elections).toHaveLength(17);
  });

  it("finds Dongtan elections by mapped region", () => {
    const region = getRegionBySlug(electionDataset, "gyeonggi-hwaseong-dongtan");
    const elections = getRegionElections(electionDataset, region.id);

    expect(region.displayName).toBe("경기도 화성시동탄구");
    expect(elections.map((election) => election.title)).toEqual(expect.arrayContaining([
      "경기도지사",
      "경기도교육감",
      "화성시장",
      "경기도 광역의원 비례대표",
      "화성시 기초의원 비례대표"
    ]));
    expect(elections).toHaveLength(11);
  });

  it("sorts candidates by ballot number and keeps a deterministic fallback", () => {
    const region = getRegionBySlug(electionDataset, "seoul-mapo-seogyo");
    const elections = getRegionElections(electionDataset, region.id);
    const detail = getElectionDetail(electionDataset, findElectionByTitle(elections, "서울특별시장").id);
    const ballotNumbers = detail.candidates.map((candidate) => candidate.ballotNumber ?? Number.MAX_SAFE_INTEGER);

    expect(ballotNumbers).toEqual([...ballotNumbers].sort((a, b) => a - b));
    expect(detail.candidates.every((candidate) => candidate.name.length > 0)).toBe(true);
  });

  it("returns candidates for education superintendent and district mayor elections", () => {
    const region = getRegionBySlug(electionDataset, "seoul-mapo-seogyo");
    const elections = getRegionElections(electionDataset, region.id);
    const education = getElectionDetail(electionDataset, findElectionByTitle(elections, "서울특별시교육감").id);
    const mapoMayor = getElectionDetail(electionDataset, findElectionByTitle(elections, "마포구청장").id);

    expect(education.candidates.length).toBeGreaterThan(0);
    expect(mapoMayor.candidates.length).toBeGreaterThan(0);
    expect(education.candidates.every((candidate) => candidate.electionId === education.id)).toBe(true);
    expect(mapoMayor.candidates.every((candidate) => candidate.electionId === mapoMayor.id)).toBe(true);
  });

  it("builds neutral quick facts without scoring language", () => {
    const region = getRegionBySlug(electionDataset, "seoul-mapo-seogyo");
    const elections = getRegionElections(electionDataset, region.id);
    const detail = getElectionDetail(electionDataset, findElectionByTitle(elections, "서울특별시장").id);
    const facts = getCandidateQuickFacts(detail.candidates[0]);

    expect(facts.map((fact) => fact.label)).toEqual(["직업", "재산", "병역", "체납", "전과"]);
    expect(facts.map((fact) => fact.value).join(" ")).not.toMatch(/추천|점수|검증|우수|위험/);
  });

  it("keeps official source and fetched timestamp in comparison rows", () => {
    const region = getRegionBySlug(electionDataset, "seoul-mapo-seogyo");
    const elections = getRegionElections(electionDataset, region.id);
    const detail = getElectionDetail(electionDataset, findElectionByTitle(elections, "서울특별시장").id);
    const comparison = buildCandidateComparison(detail.candidates.slice(0, 2));

    expect(comparison.candidates).toHaveLength(2);
    expect(comparison.rows.map((row) => row.label)).toEqual([
      "정당",
      "직업",
      "학력",
      "재산",
      "병역",
      "납세",
      "체납",
      "전과",
      "공보",
      "5대공약"
    ]);
    expect(comparison.sources.every((source) => source.url.startsWith("http"))).toBe(true);
    expect(comparison.sources.every((source) => source.fetchedAt.length > 0)).toBe(true);
  });
});
