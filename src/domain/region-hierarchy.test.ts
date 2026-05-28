import { describe, expect, it } from "vitest";
import { electionDataset } from "./generated-election-data";
import { getRegionSelectionPath, getSidoRegionOptions, getSubregionOptions } from "./region-hierarchy";

function getRegion(displayName: string) {
  const region = electionDataset.regions.find((item) => item.displayName === displayName);

  if (!region) {
    throw new Error(`Missing region: ${displayName}`);
  }

  return region;
}

describe("region hierarchy", () => {
  it("finds top-level sido options for the first selection step", () => {
    const sidoNames = getSidoRegionOptions(electionDataset.regions).map((item) => item.displayName);

    expect(sidoNames).toContain("서울특별시");
    expect(sidoNames).toContain("경기도");
    expect(sidoNames).not.toContain("서울특별시 마포구");
  });

  it("finds direct boroughs under Seoul without showing elections at city level", () => {
    const region = getRegion("서울특별시");
    const subregions = getSubregionOptions(electionDataset.regions, region);

    expect(subregions.map((item) => item.displayName)).toContain("서울특별시 강남구");
    expect(subregions.map((item) => item.displayName)).toContain("서울특별시 마포구");
    expect(subregions.length).toBeGreaterThanOrEqual(25);
  });

  it("finds direct boroughs under Busan", () => {
    const region = getRegion("부산광역시");
    const subregions = getSubregionOptions(electionDataset.regions, region);

    expect(subregions.map((item) => item.displayName)).toContain("부산광역시 강서구");
    expect(subregions.map((item) => item.displayName)).toContain("부산광역시 해운대구");
  });

  it("keeps province-level children direct and hides nested city boroughs", () => {
    const region = getRegion("경기도");
    const subregionNames = getSubregionOptions(electionDataset.regions, region).map((item) => item.displayName);

    expect(subregionNames).toContain("경기도 고양시");
    expect(subregionNames).toContain("경기도 화성시");
    expect(subregionNames).not.toContain("경기도 고양시덕양구");
    expect(subregionNames).not.toContain("경기도 화성시동탄구");
  });

  it("finds city boroughs under city-level regions", () => {
    const region = getRegion("경기도 화성시");
    const subregionNames = getSubregionOptions(electionDataset.regions, region).map((item) => item.displayName);

    expect(subregionNames).toEqual([
      "경기도 화성시동탄구",
      "경기도 화성시만세구",
      "경기도 화성시병점구",
      "경기도 화성시효행구"
    ]);
  });

  it("builds the selection path from sido to nested borough", () => {
    const region = getRegion("경기도 화성시동탄구");
    const pathNames = getRegionSelectionPath(electionDataset.regions, region).map((item) => item.displayName);

    expect(pathNames).toEqual(["경기도", "경기도 화성시", "경기도 화성시동탄구"]);
  });
});
