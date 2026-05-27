import { NextResponse } from "next/server";
import {
  getNaverMapsCredentials,
  reverseGeocodeWithKakao,
  reverseGeocodeWithNaver,
  type ReverseGeocodeResult
} from "@/domain/reverse-geocode-providers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("latitude"));
  const longitude = Number(searchParams.get("longitude"));

  if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
    return NextResponse.json({ status: "invalid_request" }, { status: 400 });
  }

  const coordinates = { latitude, longitude };
  const naverCredentials = getNaverMapsCredentials(process.env);
  const kakaoApiKey = process.env.KAKAO_REST_API_KEY;

  if (naverCredentials) {
    const result = await reverseGeocodeWithNaver(coordinates, naverCredentials);

    if (result.status === "mapped" || !kakaoApiKey) {
      return jsonForReverseGeocodeResult(result);
    }
  }

  if (kakaoApiKey) {
    return jsonForReverseGeocodeResult(await reverseGeocodeWithKakao(coordinates, kakaoApiKey));
  }

  return NextResponse.json({ status: "unconfigured" }, { status: 200 });
}

function jsonForReverseGeocodeResult(result: ReverseGeocodeResult) {
  return NextResponse.json(result, { status: result.status === "failed" ? 502 : 200 });
}

function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}
