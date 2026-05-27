import { describe, expect, it } from "vitest";
import {
  getNaverMapsCredentials,
  mapKakaoReverseGeocodeResponse,
  mapNaverReverseGeocodeResponse
} from "./reverse-geocode-providers";

describe("reverse geocode providers", () => {
  it("reads Naver Maps credentials only when both values exist", () => {
    expect(
      getNaverMapsCredentials({
        NAVER_MAPS_CLIENT_ID: " naver-client-id ",
        NAVER_MAPS_CLIENT_SECRET: " naver-client-secret "
      })
    ).toEqual({
      clientId: "naver-client-id",
      clientSecret: "naver-client-secret"
    });
    expect(getNaverMapsCredentials({ NAVER_MAPS_CLIENT_SECRET: "naver-client-secret" })).toBeNull();
  });

  it("maps Naver administrative dong results before legal dong results", () => {
    const result = mapNaverReverseGeocodeResponse({
      status: { code: 0 },
      results: [
        {
          name: "legalcode",
          region: {
            area1: { name: "서울특별시" },
            area2: { name: "마포구" },
            area3: { name: "상수동" }
          }
        },
        {
          name: "admcode",
          region: {
            area1: { name: "서울특별시" },
            area2: { name: "마포구" },
            area3: { name: "서교동" }
          }
        }
      ]
    });

    expect(result).toEqual({
      status: "mapped",
      addressName: "서울특별시 마포구 서교동",
      sido: "서울특별시",
      sigungu: "마포구",
      eupmyeondong: "서교동"
    });
  });

  it("maps Kakao administrative region results before legal region results", () => {
    const result = mapKakaoReverseGeocodeResponse({
      documents: [
        {
          region_type: "B",
          address_name: "서울특별시 마포구 상수동",
          region_1depth_name: "서울특별시",
          region_2depth_name: "마포구",
          region_3depth_name: "상수동"
        },
        {
          region_type: "H",
          address_name: "서울특별시 마포구 서교동",
          region_1depth_name: "서울특별시",
          region_2depth_name: "마포구",
          region_3depth_name: "서교동"
        }
      ]
    });

    expect(result).toMatchObject({
      status: "mapped",
      addressName: "서울특별시 마포구 서교동",
      eupmyeondong: "서교동"
    });
  });
});
