type Coordinates = {
  latitude: number;
  longitude: number;
};

type MappedReverseGeocodeResult = {
  status: "mapped";
  addressName: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
};

type UnmappedReverseGeocodeResult = {
  status: "unsupported" | "unconfigured" | "failed" | "invalid_request";
};

export type ReverseGeocodeResult = MappedReverseGeocodeResult | UnmappedReverseGeocodeResult;

type NaverMapsCredentials = {
  clientId: string;
  clientSecret: string;
};

type NaverRegionArea = {
  name?: string;
};

type NaverReverseGeocodeItem = {
  name?: string;
  region?: {
    area1?: NaverRegionArea;
    area2?: NaverRegionArea;
    area3?: NaverRegionArea;
    area4?: NaverRegionArea;
  };
};

type NaverReverseGeocodeResponse = {
  status?: {
    code?: number;
  };
  results?: NaverReverseGeocodeItem[];
};

type KakaoRegionDocument = {
  region_type: "H" | "B";
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
};

type KakaoRegionResponse = {
  documents?: KakaoRegionDocument[];
};

export function getNaverMapsCredentials(env: NodeJS.ProcessEnv): NaverMapsCredentials | null {
  const clientId = env.NAVER_MAPS_CLIENT_ID?.trim();
  const clientSecret = env.NAVER_MAPS_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

export async function reverseGeocodeWithNaver(
  coordinates: Coordinates,
  credentials: NaverMapsCredentials
): Promise<ReverseGeocodeResult> {
  const naverUrl = new URL("https://maps.apigw.ntruss.com/map-reversegeocode/v2/gc");
  naverUrl.searchParams.set("coords", `${coordinates.longitude},${coordinates.latitude}`);
  naverUrl.searchParams.set("sourcecrs", "EPSG:4326");
  naverUrl.searchParams.set("orders", "admcode,legalcode");
  naverUrl.searchParams.set("output", "json");

  try {
    const response = await fetch(naverUrl, {
      headers: {
        "X-NCP-APIGW-API-KEY-ID": credentials.clientId,
        "X-NCP-APIGW-API-KEY": credentials.clientSecret
      }
    });

    if (!response.ok) {
      return { status: "failed" };
    }

    const payload = (await response.json()) as NaverReverseGeocodeResponse;

    if (typeof payload.status?.code === "number" && payload.status.code !== 0) {
      return { status: "failed" };
    }

    return mapNaverReverseGeocodeResponse(payload);
  } catch {
    return { status: "failed" };
  }
}

export async function reverseGeocodeWithKakao(coordinates: Coordinates, apiKey: string): Promise<ReverseGeocodeResult> {
  const kakaoUrl = new URL("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json");
  kakaoUrl.searchParams.set("x", String(coordinates.longitude));
  kakaoUrl.searchParams.set("y", String(coordinates.latitude));
  kakaoUrl.searchParams.set("input_coord", "WGS84");

  try {
    const response = await fetch(kakaoUrl, {
      headers: {
        Authorization: `KakaoAK ${apiKey}`
      }
    });

    if (!response.ok) {
      return { status: "failed" };
    }

    const payload = (await response.json()) as KakaoRegionResponse;
    return mapKakaoReverseGeocodeResponse(payload);
  } catch {
    return { status: "failed" };
  }
}

export function mapKakaoReverseGeocodeResponse(payload: KakaoRegionResponse): ReverseGeocodeResult {
  const administrativeRegion =
    payload.documents?.find((document) => document.region_type === "H") ?? payload.documents?.[0] ?? null;

  if (!administrativeRegion) {
    return { status: "unsupported" };
  }

  return {
    status: "mapped",
    addressName: administrativeRegion.address_name,
    sido: administrativeRegion.region_1depth_name,
    sigungu: administrativeRegion.region_2depth_name,
    eupmyeondong: administrativeRegion.region_3depth_name
  };
}

export function mapNaverReverseGeocodeResponse(payload: NaverReverseGeocodeResponse): ReverseGeocodeResult {
  const result =
    payload.results?.find((item) => item.name === "admcode") ??
    payload.results?.find((item) => item.name === "legalcode") ??
    payload.results?.[0] ??
    null;

  const sido = normalizeNaverAreaName(result?.region?.area1);
  const sigungu = normalizeNaverAreaName(result?.region?.area2) || sido;
  const eupmyeondong = normalizeNaverAreaName(result?.region?.area3);
  const ri = normalizeNaverAreaName(result?.region?.area4);

  if (!sido) {
    return { status: "unsupported" };
  }

  return {
    status: "mapped",
    addressName: [sido, sigungu === sido ? "" : sigungu, eupmyeondong, ri].filter(Boolean).join(" "),
    sido,
    sigungu,
    eupmyeondong
  };
}

function normalizeNaverAreaName(area?: NaverRegionArea) {
  return area?.name?.trim() ?? "";
}
