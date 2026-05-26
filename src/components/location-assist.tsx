"use client";

import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { mapCoordinatesToRegion } from "@/domain/geolocation";

type LocationState = "idle" | "requesting" | "ready" | "unsupported" | "blocked";

type LocationAssistProps = {
  onRegionMapped: (regionSlug: string) => void;
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
      (position) => {
        const result = mapCoordinatesToRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

        if (result.status === "mapped") {
          setMappedName(result.displayName);
          setState("ready");
          onRegionMapped(result.regionSlug);
          return;
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

const messageByState: Record<LocationState, string> = {
  idle: "위치는 저장하지 않고 지역 추정에만 사용합니다.",
  requesting: "브라우저 위치 권한을 확인 중입니다.",
  ready: "현재 위치로 지역을 추정했습니다.",
  unsupported: "현재 위치는 아직 지원 지역 매핑 범위 밖입니다. 지역을 직접 선택해 주세요.",
  blocked: "위치를 사용할 수 없습니다. 지역을 직접 선택해 주세요."
};
