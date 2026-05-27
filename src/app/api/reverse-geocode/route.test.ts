import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const envKeys = ["KAKAO_REST_API_KEY", "NAVER_MAPS_CLIENT_ID", "NAVER_MAPS_CLIENT_SECRET"] as const;
const originalEnv = { ...process.env };

describe("reverse geocode API route", () => {
  beforeEach(() => {
    vi.restoreAllMocks();

    for (const key of envKeys) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();

    for (const key of envKeys) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it("uses Naver before Kakao when Naver credentials are configured", async () => {
    process.env.NAVER_MAPS_CLIENT_ID = "naver-client-id";
    process.env.NAVER_MAPS_CLIENT_SECRET = "naver-client-secret";
    process.env.KAKAO_REST_API_KEY = "kakao-rest-api-key";
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        status: { code: 0 },
        results: [
          {
            name: "admcode",
            region: {
              area1: { name: "서울특별시" },
              area2: { name: "마포구" },
              area3: { name: "서교동" }
            }
          }
        ]
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost/api/reverse-geocode?latitude=37.5559&longitude=126.9238")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "mapped",
      addressName: "서울특별시 마포구 서교동",
      sido: "서울특별시",
      sigungu: "마포구",
      eupmyeondong: "서교동"
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toContain("maps.apigw.ntruss.com");
    expect(url.searchParams.get("coords")).toBe("126.9238,37.5559");
    expect(url.searchParams.get("orders")).toBe("admcode,legalcode");
    expect(init.headers).toMatchObject({
      "X-NCP-APIGW-API-KEY-ID": "naver-client-id",
      "X-NCP-APIGW-API-KEY": "naver-client-secret"
    });
  });

  it("falls back to Kakao when Naver fails and a Kakao key exists", async () => {
    process.env.NAVER_MAPS_CLIENT_ID = "naver-client-id";
    process.env.NAVER_MAPS_CLIENT_SECRET = "naver-client-secret";
    process.env.KAKAO_REST_API_KEY = "kakao-rest-api-key";
    const fetchMock = vi.fn(async (url: URL) => {
      if (String(url).includes("maps.apigw.ntruss.com")) {
        return jsonResponse({ status: { code: 500 } }, { status: 500 });
      }

      return jsonResponse({
        documents: [
          {
            region_type: "H",
            address_name: "경기도 화성시 동탄7동",
            region_1depth_name: "경기도",
            region_2depth_name: "화성시",
            region_3depth_name: "동탄7동"
          }
        ]
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost/api/reverse-geocode?latitude=37.1995&longitude=127.098")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: "mapped",
      addressName: "경기도 화성시 동탄7동",
      eupmyeondong: "동탄7동"
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("maps.apigw.ntruss.com");
    expect(String(fetchMock.mock.calls[1][0])).toContain("dapi.kakao.com");
  });

  it("returns unconfigured when no provider credentials exist", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("http://localhost/api/reverse-geocode?latitude=37.5559&longitude=126.9238")
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init
  });
}
