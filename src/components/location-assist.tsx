"use client";

import { LocateFixed } from "lucide-react";
import { useState } from "react";

type LocationState = "idle" | "requesting" | "ready" | "blocked";

export function LocationAssist() {
  const [state, setState] = useState<LocationState>("idle");

  function requestLocation() {
    if (!("geolocation" in navigator)) {
      setState("blocked");
      return;
    }

    setState("requesting");
    navigator.geolocation.getCurrentPosition(
      () => setState("ready"),
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
      <p className="mt-2 text-xs leading-5 text-muted">{messageByState[state]}</p>
    </div>
  );
}

const messageByState: Record<LocationState, string> = {
  idle: "위치는 저장하지 않고 지역 추정에만 사용합니다.",
  requesting: "브라우저 위치 권한을 확인 중입니다.",
  ready: "위치 좌표만 확인했습니다. 아직 주소와 선거구 자동 매핑은 연결되지 않았습니다.",
  blocked: "위치를 사용할 수 없습니다. 지역을 직접 선택해 주세요."
};
