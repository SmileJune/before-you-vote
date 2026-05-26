"use client";

import { LocateFixed } from "lucide-react";
import { useState } from "react";
import type { ReverseGeocodedRegion } from "@/domain/reverse-geocode";
import { mapCoordinatesToRegion } from "@/domain/geolocation";

type LocationState = "idle" | "requesting" | "ready" | "unsupported" | "blocked";

type LocationAssistProps = {
  onRegionMapped: (mapping: LocationMapping) => boolean;
};

type LocationMapping =
  | {
      type: "reverse-geocoded";
      address: ReverseGeocodedRegion;
    }
  | {
      type: "fallback";
      regionSlug: string;
      areaId?: string;
      displayName: string;
    };

type ReverseGeocodeApiResponse =
  | ({
      status: "mapped";
    } & ReverseGeocodedRegion)
  | {
      status: "unsupported" | "unconfigured" | "failed" | "invalid_request";
    };

export function LocationAssist({ onRegionMapped }: LocationAssistProps) {
  const [state, setState] = useState<LocationState>("idle");
  const [mappedName, setMappedName] = useState<string | null>(null);

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setState("blocked");
      return;
    }

    setState("requesting");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const reverseGeocoded = await reverseGeocodeCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        if (reverseGeocoded?.status === "mapped") {
          const isMapped = onRegionMapped({
            type: "reverse-geocoded",
            address: {
              sido: reverseGeocoded.sido,
              sigungu: reverseGeocoded.sigungu,
              eupmyeondong: reverseGeocoded.eupmyeondong,
              addressName: reverseGeocoded.addressName
            }
          });

          if (isMapped) {
            setMappedName(reverseGeocoded.addressName);
            setState("ready");
            return;
          }
        }

        const result = mapCoordinatesToRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        if (result.status === "mapped") {
          const isMapped = onRegionMapped({
            type: "fallback",
            regionSlug: result.regionSlug,
            areaId: result.areaId,
            displayName: result.displayName
          });

          if (isMapped) {
            setMappedName(result.displayName);
            setState("ready");
            return;
          }
        }

        setMappedName(null);
        setState("unsupported");
      },
      () => setState("blocked"),
      { enableHighAccuracy: false, maximumAge: 300_000, timeout: 5000 }
    );
  }

  return (
    <div className="mt-4 rounded-md border border-line bg-paper p-3">
      <button
        type="button"
        onClick={requestLocation}
        className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 text-sm font-bold text-white"
      >
        <LocateFixed size={18} />
        내 위치로 지역 찾기
      </button>
      <p className="mt-2 text-xs leading-5 text-muted">{state === "ready" && mappedName ? `${mappedName}으로 추정했습니다.` : messageByState[state]}</p>
    </div>
  );
}

async function reverseGeocodeCoordinates(coordinates: { latitude: number; longitude: number }) {
  const url = new URL("/api/reverse-geocode", window.location.origin);
  url.searchParams.set("latitude", String(coordinates.latitude));
  url.searchParams.set("longitude", String(coordinates.longitude));

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ReverseGeocodeApiResponse;
  } catch {
    return null;
  }
}

const messageByState: Record<LocationState, string> = {
  idle: "위치는 저장하지 않고 지역 추정에만 사용합니다.",
  requesting: "브라우저 위치 권한을 확인 중입니다.",
  ready: "현재 위치로 지역을 추정했습니다.",
  unsupported: "현재 위치는 아직 지원 지역 매핑 범위 밖입니다. 지역을 직접 선택해 주세요.",
  blocked: "위치를 사용할 수 없습니다. 지역을 직접 선택해 주세요."
};
