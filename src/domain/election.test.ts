import { describe, expect, it } from "vitest";
import {
  buildCandidateComparison,
  getCandidateQuickFacts,
  getElectionDetail,
  getRegionBySlug,
  getRegionElections
} from "./election";
import { sampleDataset } from "./sample-data";

describe("election domain", () => {
  it("finds a region by slug and returns only elections for that region", () => {
    const region = getRegionBySlug(sampleDataset, "seoul-mapo-seogyo");
    const elections = getRegionElections(sampleDataset, region.id);

    expect(region.displayName).toBe("서울특별시 마포구 서교동");
    expect(elections.map((election) => election.title)).toEqual([
      "서울특별시장",
      "서울특별시교육감",
      "마포구청장"
    ]);
  });

  it("sorts candidates by ballot number and keeps a deterministic fallback", () => {
    const detail = getElectionDetail(sampleDataset, "seoul-mayor");

    expect(detail.candidates.map((candidate) => candidate.name)).toEqual([
      "정원오",
      "오세훈",
      "김정철",
      "유지혜",
      "이강산",
      "권영국"
    ]);
  });

  it("returns candidates for education superintendent and district mayor elections", () => {
    const education = getElectionDetail(sampleDataset, "seoul-education-superintendent");
    const mapoMayor = getElectionDetail(sampleDataset, "mapo-mayor");

    expect(education.candidates.map((candidate) => candidate.name)).toEqual(["강신만", "조희연"]);
    expect(mapoMayor.candidates.map((candidate) => candidate.name)).toEqual(["유동균", "박강수"]);
  });

  it("builds neutral quick facts without scoring language", () => {
    const detail = getElectionDetail(sampleDataset, "seoul-mayor");
    const facts = getCandidateQuickFacts(detail.candidates[0]);

    expect(facts).toEqual([
      { label: "직업", value: "정당인" },
      { label: "재산", value: "18.2억" },
      { label: "병역", value: "군필" },
      { label: "체납", value: "0원" },
      { label: "전과", value: "2건" }
    ]);
    expect(facts.map((fact) => fact.value).join(" ")).not.toMatch(/추천|점수|검증|우수|위험/);
  });

  it("keeps official source and fetched timestamp in comparison rows", () => {
    const detail = getElectionDetail(sampleDataset, "seoul-mayor");
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
    expect(comparison.sources.every((source) => source.url.startsWith("https://"))).toBe(true);
    expect(comparison.sources.every((source) => source.fetchedAt.length > 0)).toBe(true);
  });
});
