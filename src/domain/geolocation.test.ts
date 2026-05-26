import { describe, expect, it } from "vitest";
import { mapCoordinatesToRegion } from "./geolocation";

describe("geolocation mapping", () => {
  it("maps Dongtan coordinates to the supported Hwaseong Dongtan region", () => {
    const result = mapCoordinatesToRegion({ latitude: 37.1995, longitude: 127.098 });

    expect(result).toEqual({
      status: "mapped",
      regionSlug: "gyeonggi-hwaseong-dongtan",
      displayName: "경기도 화성시 동탄동"
    });
  });

  it("maps Seogyo coordinates to the supported Mapo Seogyo region", () => {
    const result = mapCoordinatesToRegion({ latitude: 37.5559, longitude: 126.9238 });

    expect(result).toEqual({
      status: "mapped",
      regionSlug: "seoul-mapo-seogyo",
      displayName: "서울특별시 마포구 서교동"
    });
  });

  it("returns unsupported when coordinates are outside supported mapping areas", () => {
    const result = mapCoordinatesToRegion({ latitude: 35.1796, longitude: 129.0756 });

    expect(result).toEqual({ status: "unsupported" });
  });
});
