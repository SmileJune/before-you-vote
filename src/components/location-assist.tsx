"use client";

import { LocateFixed } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
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
  const isInteractive = useSyncExternalStore(
    subscribeToInteractiveState,
    getInteractiveSnapshot,
    getServerInteractiveSnapshot
  );
  const isRequesting = state === "requesting";
  const isButtonDisabled = !isInteractive || isRequesting;

  function requestLocation() {
    if (isButtonDisabled) {
      return;
    }

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
        disabled={isButtonDisabled}
        aria-busy={isRequesting}
        onClick={requestLocation}
        className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-bold text-white transition ${
          isButtonDisabled ? "cursor-not-allowed bg-muted opacity-70" : "bg-ink"
        }`}
      >
        <LocateFixed className={isRequesting ? "animate-pulse" : undefined} size={18} />
        {!isInteractive ? "지역 찾기 준비 중" : isRequesting ? "위치 확인 중" : "내 위치로 지역 찾기"}
      </button>
      <p className="mt-2 text-xs leading-5 text-muted">
        {!isInteractive
          ? "페이지 기능을 불러오는 중입니다. 잠시 후 위치 찾기를 사용할 수 있습니다."
          : state === "ready" && mappedName
            ? `${mappedName}으로 추정했습니다.`
            : messageByState[state]}
      </p>
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

function subscribeToInteractiveState() {
  return () => undefined;
}

function getInteractiveSnapshot() {
  return true;
}

function getServerInteractiveSnapshot() {
  return false;
}
