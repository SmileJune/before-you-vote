import { describe, expect, it } from "vitest";
import { resolveReverseGeocodedRegion } from "./reverse-geocode";
import type { Dataset } from "./types";

const dataset = {
  regions: [
    {
      id: "mapo",
      slug: "seoul-mapo-seogyo",
      displayName: "서울특별시 마포구",
      sido: "서울특별시",
      sigungu: "마포구",
      eupmyeondong: "",
      notice: ""
    },
    {
      id: "dongtan",
      slug: "gyeonggi-hwaseong-dongtan",
      displayName: "경기도 화성시동탄구",
      sido: "경기도",
      sigungu: "화성시동탄구",
      eupmyeondong: "",
      notice: ""
    }
  ],
  elections: [],
  candidates: []
} satisfies Dataset;

describe("reverse geocode selection resolver", () => {
  it("resolves a Kakao administrative dong to a supported area option", () => {
    const result = resolveReverseGeocodedRegion(dataset, {
      sido: "경기도",
      sigungu: "화성시",
      eupmyeondong: "동탄7동",
      addressName: "경기도 화성시 동탄7동"
    });

    expect(result).toEqual({
      regionSlug: "gyeonggi-hwaseong-dongtan",
      areaId: "gyeonggi-hwaseong-dongtan-동탄7동",
      displayName: "경기도 화성시동탄구 동탄7동"
    });
  });

  it("supports shortened sido names from address APIs", () => {
    const result = resolveReverseGeocodedRegion(dataset, {
      sido: "서울",
      sigungu: "마포구",
      eupmyeondong: "서교동",
      addressName: "서울 마포구 서교동"
    });

    expect(result).toMatchObject({
      regionSlug: "seoul-mapo-seogyo",
      areaId: "seoul-mapo-seogyo-서교동"
    });
  });
});
