import { NextResponse } from "next/server";

type KakaoRegionDocument = {
  region_type: "H" | "B";
  address_name: string;
  region_1depth_name: string;
  region_2depth_name: string;
  region_3depth_name: string;
  region_4depth_name: string;
};

type KakaoRegionResponse = {
  documents?: KakaoRegionDocument[];
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("latitude"));
  const longitude = Number(searchParams.get("longitude"));

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ status: "unconfigured" }, { status: 200 });
  }

  const kakaoUrl = new URL("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json");
  kakaoUrl.searchParams.set("x", String(longitude));
  kakaoUrl.searchParams.set("y", String(latitude));
  kakaoUrl.searchParams.set("input_coord", "WGS84");

  const response = await fetch(kakaoUrl, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`
    }
  });

  if (!response.ok) {
    return NextResponse.json({ status: "failed" }, { status: 502 });
  }

  const payload = (await response.json()) as KakaoRegionResponse;
  const administrativeRegion =
    payload.documents?.find((document) => document.region_type === "H") ?? payload.documents?.[0] ?? null;

  if (!administrativeRegion) {
    return NextResponse.json({ status: "unsupported" }, { status: 200 });
  }

  return NextResponse.json({
    status: "mapped",
    addressName: administrativeRegion.address_name,
    sido: administrativeRegion.region_1depth_name,
    sigungu: administrativeRegion.region_2depth_name,
    eupmyeondong: administrativeRegion.region_3depth_name
  });
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}
