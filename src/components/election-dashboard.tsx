"use client";

import { AlertCircle, CheckCircle2, ChevronRight, FileText, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type UIEvent, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  buildCandidateComparison,
  getRegionBySlug,
  getRegionElections
} from "@/domain/election";
import {
  filterElectionsByAdministrativeArea,
  getAdministrativeAreaOption,
  getAdministrativeAreaOptions
} from "@/domain/district-mapping";
import { resolveReverseGeocodedRegion, type ReverseGeocodedRegion } from "@/domain/reverse-geocode";
import { getRegionSelectionPath, getSidoRegionOptions, getSubregionOptions } from "@/domain/region-hierarchy";
import type { Candidate, CandidateDocument, Dataset, ElectionDetail, Region } from "@/domain/types";
import { LocationAssist } from "@/components/location-assist";
import { getPartyColor } from "@/domain/party-colors";
import { getDocumentPreviewPath, parseAllowedDocumentUrl } from "@/domain/document-links";

const selectedRegionSlug = "seoul-mapo-seogyo";
const dashboardSelectionStorageKey = "before-you-vote:dashboard-selection";
const legacyDashboardSelectionCookieName = "before-you-vote-dashboard-selection";
const dashboardSelectionRegionParamName = "region";
const dashboardSelectionAreaParamName = "area";
const dashboardSelectionElectionParamName = "election";
const dashboardReturnScrollStorageKey = "before-you-vote:dashboard-return-scroll";
const electionDetailApiPath = "/api/election-detail";

type DashboardSelection = {
  regionSlug: string;
  areaId: string;
  electionId: string;
};

type DashboardDataset = Pick<Dataset, "regions" | "elections">;

type ElectionDashboardProps = {
  dataset: DashboardDataset;
  initialSelection?: Partial<DashboardSelection> | null;
};

export function ElectionDashboard({ dataset, initialSelection }: ElectionDashboardProps) {
  const normalizedInitialSelection = useMemo(
    () => normalizeDashboardSelection(dataset, initialSelection ?? {}),
    [dataset, initialSelection]
  );
  const [selection, setSelection] = useState<DashboardSelection>(() => normalizedInitialSelection);
  const selectedRegion = selection.regionSlug;
  const selectedAreaId = selection.areaId;
  const region = getRegionBySlug(dataset, selectedRegion);
  const regionSelectionPath = useMemo(() => getRegionSelectionPath(dataset.regions, region), [dataset.regions, region]);
  const sidoRegionOptions = useMemo(() => getSidoRegionOptions(dataset.regions), [dataset.regions]);
  const selectedSidoRegion = regionSelectionPath[0] ?? region;
  const selectedSigunguRegion = regionSelectionPath[1] ?? null;
  const selectedNestedRegion = regionSelectionPath[2] ?? null;
  const sigunguOptions = getSubregionOptions(dataset.regions, selectedSidoRegion);
  const nestedRegionOptions = selectedSigunguRegion ? getSubregionOptions(dataset.regions, selectedSigunguRegion) : [];
  const selectedSigunguRegionSlug =
    selectedSigunguRegion && sigunguOptions.some((item) => item.slug === selectedSigunguRegion.slug) ? selectedSigunguRegion.slug : "";
  const selectedNestedRegionSlug =
    selectedNestedRegion && nestedRegionOptions.some((item) => item.slug === selectedNestedRegion.slug) ? selectedNestedRegion.slug : "";
  const regionElections = getRegionElections(dataset, region.id);
  const subregionOptions = getSubregionOptions(dataset.regions, region);
  const areaOptions = getAdministrativeAreaOptions(region.slug);
  const selectedArea = getAdministrativeAreaOption(region.slug, selectedAreaId);
  const isSubregionSelectionMissing = subregionOptions.length > 0;
  const shouldRequireAreaSelection = areaOptions.length > 0;
  const isAreaSelectionMissing = shouldRequireAreaSelection && !selectedArea;
  const isElectionSelectionBlocked = isSubregionSelectionMissing || isAreaSelectionMissing;
  const elections = isElectionSelectionBlocked
    ? []
    : shouldRequireAreaSelection
      ? filterElectionsByAdministrativeArea(regionElections, selectedArea)
      : regionElections;
  const selectedElectionId = selection.electionId;
  const activeElectionId = elections.some((item) => item.id === selectedElectionId) ? selectedElectionId : elections[0]?.id ?? "";
  const [electionDetails, setElectionDetails] = useState<Record<string, ElectionDetail>>({});
  const [failedElectionId, setFailedElectionId] = useState<string | null>(null);
  const election = activeElectionId ? electionDetails[activeElectionId] ?? null : null;
  const isElectionDetailLoading = Boolean(activeElectionId && !election && failedElectionId !== activeElectionId);
  const hasElectionDetailError = Boolean(activeElectionId && !election && failedElectionId === activeElectionId);
  const comparison = useMemo(() => buildCandidateComparison(election?.candidates ?? []), [election]);
  const isInteractive = useSyncExternalStore(
    subscribeToInteractiveState,
    getInteractiveSnapshot,
    getServerInteractiveSnapshot
  );
  const [comparisonScrollLeft, setComparisonScrollLeft] = useState(0);
  const [isComparisonScrollable, setIsComparisonScrollable] = useState(false);
  const [canComparisonScrollRight, setCanComparisonScrollRight] = useState(false);
  const comparisonScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const comparisonLabelColumnWidth = 96;
  const comparisonValueColumnWidth = 128;
  const comparisonGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `${comparisonLabelColumnWidth}px repeat(${comparison.rows.length}, minmax(${comparisonValueColumnWidth}px, 1fr))`,
      minWidth: `max(100%, ${comparisonLabelColumnWidth + comparison.rows.length * comparisonValueColumnWidth}px)`
    }),
    [comparison.rows.length]
  );
  const comparisonHeaderGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `repeat(${comparison.rows.length}, minmax(${comparisonValueColumnWidth}px, 1fr))`,
      minWidth: `max(100%, ${comparison.rows.length * comparisonValueColumnWidth}px)`,
      transform: `translateX(-${comparisonScrollLeft}px)`
    }),
    [comparison.rows.length, comparisonScrollLeft]
  );
  const updateComparisonScrollState = useCallback((container: HTMLDivElement | null = comparisonScrollContainerRef.current) => {
    if (!container) {
      setComparisonScrollLeft(0);
      setIsComparisonScrollable(false);
      setCanComparisonScrollRight(false);
      return;
    }

    const maxScrollLeft = container.scrollWidth - container.clientWidth;
    const nextIsScrollable = maxScrollLeft > 1;

    setComparisonScrollLeft(container.scrollLeft);
    setIsComparisonScrollable(nextIsScrollable);
    setCanComparisonScrollRight(nextIsScrollable && container.scrollLeft < maxScrollLeft - 1);
  }, []);
  useEffect(() => {
    if (!activeElectionId || electionDetails[activeElectionId]) {
      return;
    }

    const abortController = new AbortController();
    const params = new URLSearchParams({ electionId: activeElectionId });

    fetch(`${electionDetailApiPath}?${params.toString()}`, {
      headers: {
        Accept: "application/json"
      },
      signal: abortController.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load election detail.");
        }

        return response.json() as Promise<ElectionDetail>;
      })
      .then((detail) => {
        setElectionDetails((currentDetails) => {
          if (currentDetails[detail.id]) {
            return currentDetails;
          }

          return {
            ...currentDetails,
            [detail.id]: detail
          };
        });
        setFailedElectionId((currentElectionId) => (currentElectionId === detail.id ? null : currentElectionId));
      })
      .catch(() => {
        if (abortController.signal.aborted) {
          return;
        }

        setFailedElectionId(activeElectionId);
      });

    return () => {
      abortController.abort();
    };
  }, [activeElectionId, electionDetails]);

  useEffect(() => {
    const container = comparisonScrollContainerRef.current;

    if (!container) {
      updateComparisonScrollState(null);
      return;
    }

    container.scrollLeft = 0;
    updateComparisonScrollState(container);
  }, [activeElectionId, comparison.rows.length, updateComparisonScrollState]);

  useEffect(() => {
    const container = comparisonScrollContainerRef.current;

    if (!container) {
      return;
    }

    const resizeObserver =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => updateComparisonScrollState(container));
    const handleResize = () => updateComparisonScrollState(container);

    resizeObserver?.observe(container);
    window.addEventListener("resize", handleResize);
    updateComparisonScrollState(container);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [comparison.rows.length, updateComparisonScrollState]);

  useEffect(() => {
    clearLegacyDashboardSelectionCookie();

    function syncSelectionFromUrl() {
      const urlSelection = readDashboardSelectionUrl() ?? readPersistedDashboardSelection();

      if (!urlSelection) {
        return;
      }

      const nextSelection = normalizeDashboardSelection(dataset, urlSelection);

      setSelection((currentSelection) => {
        if (areDashboardSelectionsEqual(currentSelection, nextSelection)) {
          return currentSelection;
        }

        return nextSelection;
      });
      setComparisonScrollLeft(0);
    }

    syncSelectionFromUrl();
    window.addEventListener("pageshow", syncSelectionFromUrl);
    window.addEventListener("popstate", syncSelectionFromUrl);

    return () => {
      window.removeEventListener("pageshow", syncSelectionFromUrl);
      window.removeEventListener("popstate", syncSelectionFromUrl);
    };
  }, [dataset]);

  useEffect(() => {
    if (activeElectionId && !election) {
      return;
    }

    function restoreScroll() {
      restoreDashboardReturnScroll();
    }

    restoreScroll();
    window.addEventListener("pageshow", restoreScroll);

    return () => {
      window.removeEventListener("pageshow", restoreScroll);
    };
  }, [activeElectionId, election, selectedAreaId, selectedRegion]);

  function handleRegionMapped(mapping: LocationMapping) {
    if (mapping.type === "reverse-geocoded") {
      const resolved = resolveReverseGeocodedRegion(dataset, mapping.address);

      if (!resolved) {
        return false;
      }

      selectRegion(resolved.regionSlug, resolved.areaId);
      return true;
    }

    selectRegion(mapping.regionSlug, mapping.areaId ?? "");
    return true;
  }

  function handleRegionSelected(regionSlug: string) {
    selectRegion(regionSlug);
  }

  function selectRegion(regionSlug: string, areaId = "") {
    const nextRegion = getRegionBySlug(dataset, regionSlug);
    const nextRegionElections = getRegionElections(dataset, nextRegion.id);
    const nextSubregionOptions = getSubregionOptions(dataset.regions, nextRegion);
    const nextAreaOptions = getAdministrativeAreaOptions(nextRegion.slug);
    const nextArea = getAdministrativeAreaOption(nextRegion.slug, areaId);
    const isNextSubregionSelectionMissing = nextSubregionOptions.length > 0;
    const isNextAreaSelectionMissing = nextAreaOptions.length > 0 && !nextArea;
    const isNextElectionSelectionBlocked = isNextSubregionSelectionMissing || isNextAreaSelectionMissing;
    const nextElections = isNextElectionSelectionBlocked
      ? []
      : nextAreaOptions.length > 0
        ? filterElectionsByAdministrativeArea(nextRegionElections, nextArea)
        : nextRegionElections;

    updateSelection({
      regionSlug,
      areaId: nextArea && !isNextSubregionSelectionMissing ? areaId : "",
      electionId: isNextElectionSelectionBlocked ? "" : nextElections[0]?.id ?? ""
    });
  }

  function handleAreaSelected(areaId: string) {
    const nextArea = getAdministrativeAreaOption(region.slug, areaId);
    const nextElections = nextArea ? filterElectionsByAdministrativeArea(regionElections, nextArea) : [];

    updateSelection({
      regionSlug: selectedRegion,
      areaId,
      electionId: nextArea ? nextElections[0]?.id ?? "" : ""
    });
  }

  function handleElectionSelected(electionId: string) {
    updateSelection({
      regionSlug: selectedRegion,
      areaId: selectedAreaId,
      electionId
    });
  }

  function handleComparisonScroll(event: UIEvent<HTMLDivElement>) {
    updateComparisonScrollState(event.currentTarget);
  }

  function updateSelection(nextSelection: DashboardSelection) {
    setComparisonScrollLeft(0);
    setSelection(nextSelection);
    persistDashboardSelection(nextSelection);
    replaceDashboardSelectionUrl(nextSelection);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-paper text-ink shadow-soft">
      <section className="bg-white px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-civic">투표전5분</p>
            <h1 className="mt-1 text-2xl font-bold tracking-normal">내 투표지 후보 확인</h1>
          </div>
          <div className="rounded-full border border-line bg-paper p-2 text-civic" aria-hidden>
            <ShieldCheck size={22} />
          </div>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          공식 자료 기준으로 같은 항목을 나란히 보여줍니다. 후보 추천이나 점수화는 하지 않습니다.
        </p>
        <LocationAssist onRegionMapped={handleRegionMapped} />
      </section>

      <section className="border-y border-line bg-white px-5 py-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 shrink-0 text-civic" size={20} />
          <div>
            <p className="text-xs font-semibold text-muted">현재 선택 지역</p>
            <h2 className="mt-1 text-lg font-bold">{region.displayName}</h2>
            <p className="mt-1 text-xs leading-5 text-muted">{region.notice}</p>
            {subregionOptions.length > 0 ? (
              <p className="mt-1 text-xs leading-5 text-muted">
                이 지역은 구별로 투표지가 달라집니다. 아래 세부 지역을 먼저 선택해 주세요.
              </p>
            ) : areaOptions.length > 0 ? (
              <p className="mt-1 text-xs leading-5 text-muted">
                읍면동에 따라 지방의원 선거구가 갈립니다. 아래 읍면동을 선택하면 실제로 볼 선거만 남깁니다.
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-muted">
            지역 직접 선택
          </p>
          <div className="mt-2 grid gap-3">
            <div>
              <label htmlFor="sido-select" className="text-[11px] font-semibold text-muted">
                시도
              </label>
              <select
                id="sido-select"
                value={selectedSidoRegion.slug}
                onChange={(event) => handleRegionSelected(event.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink"
              >
                {sidoRegionOptions.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.displayName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sigungu-select" className="text-[11px] font-semibold text-muted">
                시군구
              </label>
              <select
                id="sigungu-select"
                value={selectedSigunguRegionSlug}
                onChange={(event) => handleRegionSelected(event.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink disabled:text-muted"
                disabled={sigunguOptions.length === 0}
              >
                <option value="" disabled>
                  시군구 선택
                </option>
                {sigunguOptions.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {getRegionStepLabel(item, selectedSidoRegion)}
                  </option>
                ))}
              </select>
            </div>

            {nestedRegionOptions.length > 0 ? (
              <div>
                <label htmlFor="nested-region-select" className="text-[11px] font-semibold text-muted">
                  구
                </label>
                <select
                  id="nested-region-select"
                  value={selectedNestedRegionSlug}
                  onChange={(event) => handleRegionSelected(event.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink"
                >
                  <option value="" disabled>
                    구 선택
                  </option>
                  {nestedRegionOptions.map((item) => (
                    <option key={item.id} value={item.slug}>
                      {getRegionStepLabel(item, selectedSigunguRegion)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </div>
        {areaOptions.length > 0 ? (
          <div className="mt-4 rounded-md border border-line bg-paper p-3">
            <label htmlFor="area-select" className="text-xs font-semibold text-muted">
              읍면동 선택
            </label>
            <select
              id="area-select"
              value={selectedAreaId}
              onChange={(event) => handleAreaSelected(event.target.value)}
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm font-semibold text-ink"
            >
              <option value="">읍면동을 선택하세요</option>
              {areaOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedArea ? (
              <p className="mt-2 text-xs leading-5 text-muted">
                <span className="block">{selectedArea.districtNames.join(", ")} 기준입니다.</span>
                <span className="block">출처: {selectedArea.sourceLabel}</span>
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                읍면동을 선택해야 실제 투표지 기준 선거를 확인할 수 있습니다.
              </p>
            )}
          </div>
        ) : null}
      </section>

      {isElectionSelectionBlocked ? (
        <section className="px-5 py-5">
          <div className="rounded-md border border-line bg-white p-4">
            {isSubregionSelectionMissing ? (
              <>
                <p className="text-sm font-bold">세부 지역을 먼저 선택하세요</p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  같은 시 안에서도 구와 읍면동에 따라 시·도의원과 구·시·군의원 선거구가 달라집니다. 실제 투표지에 가까운 목록을 보려면 세부 지역 선택이 필요합니다.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold">읍면동을 먼저 선택하세요</p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  같은 시·군·구 안에서도 시·도의원과 구·시·군의원 선거구가 달라집니다. 실제 투표지에 가까운 목록을 보려면 읍면동 선택이 필요합니다.
                </p>
              </>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="px-5 py-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">확인할 선거</h2>
              <span className="text-xs text-muted">{elections.length}개</span>
            </div>
            <div className="mt-3 space-y-2">
              {elections.map((item) => {
                const isSelected = item.id === activeElectionId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleElectionSelected(item.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left ${
                      isSelected ? "border-civic bg-white ring-2 ring-civic/15" : "border-line bg-white"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div>
                      <p className="text-sm font-bold">{item.title}</p>
                      <p className="mt-1 text-xs text-muted">
                        {item.category} · {item.districtName}
                      </p>
                    </div>
                    <ChevronRight className={isSelected ? "text-civic" : "text-muted"} size={18} />
                  </button>
                );
              })}
            </div>
          </section>

          <section className="bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">후보 비교</h2>
              <span className="text-xs text-muted">전체 {comparison.candidates.length}명</span>
            </div>
            {isElectionDetailLoading ? (
              <div className="mt-3 rounded-md border border-line bg-white p-4 text-xs leading-5 text-muted">
                후보 정보를 불러오는 중입니다.
              </div>
            ) : hasElectionDetailError ? (
              <div className="mt-3 rounded-md border border-line bg-white p-4 text-xs leading-5 text-muted">
                후보 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
              </div>
            ) : comparison.candidates.length >= 2 ? (
              <div className="relative mt-3 overflow-hidden rounded-md border border-line bg-white">
                <div className="sticky top-0 z-30 flex rounded-t-md border-b border-line bg-paper text-xs font-bold shadow-[0_1px_0_0_#d9e1ec]">
                  <div className="w-24 shrink-0 border-r border-line bg-paper px-3 py-2">후보</div>
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <div className="grid will-change-transform" style={comparisonHeaderGridStyle}>
                      {comparison.rows.map((row) => (
                        <div key={row.label} className="min-w-0 bg-paper px-3 py-2">
                          <span className="block truncate">{row.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div
                  ref={comparisonScrollContainerRef}
                  className="overflow-x-auto [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]"
                  onScroll={handleComparisonScroll}
                  tabIndex={0}
                  aria-label="후보 비교 표"
                >
                  {comparison.candidates.map((candidate, candidateIndex) => (
                    <div
                      key={candidate.id}
                      className="grid border-b border-line text-xs last:border-b-0"
                      style={comparisonGridStyle}
                    >
                      <div className="sticky left-0 z-20 border-r border-line bg-paper px-3 py-2 font-semibold text-ink">
                        <span className="block truncate">{candidate.name}</span>
                      </div>
                      {comparison.rows.map((row) => {
                        const value = row.values[candidateIndex] ?? "-";

                        return (
                          <div key={`${candidate.id}-${row.label}`} className="min-w-0 whitespace-pre-line px-3 py-2 leading-5">
                            {row.label === "정당" ? <PartyBadge partyName={value} /> : value}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {isComparisonScrollable && canComparisonScrollRight ? (
                  <div
                    className="pointer-events-none absolute bottom-0 right-0 top-9 z-40 flex w-14 justify-end bg-gradient-to-l from-white via-white/80 to-transparent pr-1.5 pt-3"
                    aria-hidden
                  >
                    <div className="inline-flex h-6 items-center gap-0.5 rounded-full border border-line bg-white/95 px-1.5 text-[10px] font-bold text-civic shadow-sm">
                      <span>밀기</span>
                      <ChevronRight size={13} strokeWidth={2.5} />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-line bg-white p-4 text-xs leading-5 text-muted">
                후보가 2명 이상이면 모든 후보를 같은 항목으로 비교합니다.
              </div>
            )}
          </section>

          {election ? (
            <section id={election.id} className="bg-white px-5 py-5">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-civic">{election.ballotName}</p>
                  <h2 className="mt-1 text-xl font-bold">후보별 상세</h2>
                </div>
                <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">기호순</span>
              </div>

              {election.candidates.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {election.candidates.map((candidate) => (
                    <article key={candidate.id} className="rounded-md border border-line bg-white p-4">
                      <div className="flex gap-3">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-paper">
                          {candidate.photoUrl ? (
                            <Image src={candidate.photoUrl} alt={`${candidate.name} 후보 사진`} fill sizes="64px" className="object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted">사진</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-muted">
                                {candidate.ballotNumber === null ? `순번 ${candidate.sortOrder ?? "-"}` : `기호 ${candidate.ballotNumber}`}
                              </p>
                              <h3 className="mt-0.5 text-lg font-bold">{candidate.name}</h3>
                            </div>
                            <PartyBadge partyName={candidate.partyName} />
                          </div>
                        </div>
                      </div>

                      <CandidateDetailTable candidate={candidate} electionTitle={election.title} districtName={election.districtName} />

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                        <DocumentLink
                          isInteractive={isInteractive}
                          label="공보"
                          url={candidate.pamphletPdf?.url}
                          status={candidate.pamphletPdf?.status}
                        />
                        <DocumentLink
                          isInteractive={isInteractive}
                          label="5대공약"
                          url={candidate.pledgePdf?.url}
                          status={candidate.pledgePdf?.status}
                        />
                        <DocumentLink isInteractive={isInteractive} label="공개자료" url={candidate.disclosureViewerUrl} status="available" />
                      </div>
                      <p className="mt-3 text-[11px] leading-4 text-muted">
                        <span className="block">출처: {candidate.source.label}</span>
                        <span className="block">수집: {formatCollectedDate(candidate.source.fetchedAt)}</span>
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-line bg-paper p-4">
                  <p className="text-sm font-bold">후보 데이터 수집 전입니다.</p>
                  <p className="mt-2 text-xs leading-5 text-muted">
                    이 지역의 후보자 목록이 아직 공식 데이터셋에 없습니다. 수집 범위를 확인해 주세요.
                  </p>
                </div>
              )}
            </section>
          ) : activeElectionId ? (
            <section className="bg-white px-5 py-5">
              <div className="rounded-md border border-line bg-paper p-4">
                <p className="text-sm font-bold">
                  {hasElectionDetailError ? "후보 정보를 불러오지 못했습니다" : "후보 정보를 불러오는 중입니다"}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {hasElectionDetailError ? "네트워크 상태를 확인한 뒤 다시 선택해 주세요." : "선택한 선거의 후보 상세만 가져오고 있습니다."}
                </p>
              </div>
            </section>
          ) : null}
        </>
      )}

      <footer className="bg-white px-5 py-5 text-xs leading-5 text-muted">
        <div className="flex gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p>위치 기반 조회는 실제 투표구와 다를 수 있습니다. 투표안내문 주소와 다르면 직접 지역을 선택하세요.</p>
            <p className="mt-2">
              잘못된 정보가 있다면 후보자명, 지역, 항목, 공식 근거 링크를 포함해{" "}
              <a href="mailto:godhkekf244@gmail.com" className="font-semibold text-civic underline underline-offset-2">
                godhkekf244@gmail.com
              </a>
              으로 알려주세요.
            </p>
            <p className="mt-2">
              <a href="/privacy" className="font-semibold text-civic underline underline-offset-2">
                개인정보처리방침
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function CandidateDetailTable({
  candidate,
  electionTitle,
  districtName
}: {
  candidate: Candidate;
  electionTitle: string;
  districtName: string;
}) {
  const details = [
    { label: "정당", value: candidate.partyName, type: "party" },
    { label: "출마 선거", value: electionTitle },
    { label: "선거구", value: districtName },
    { label: "직업", value: candidate.job },
    { label: "학력", value: candidate.education },
    { label: "경력", value: candidate.career },
    { label: "재산", value: candidate.assets?.display ?? "-" },
    { label: "병역", value: candidate.military ?? "-" },
    { label: "납세", value: candidate.taxPaid?.display ?? "-" },
    { label: "최근 5년 체납", value: candidate.taxArrearsLastFiveYears?.display ?? "-" },
    { label: "현재 체납", value: candidate.taxArrearsCurrent?.display ?? "-" },
    { label: "전과", value: candidate.criminalRecordCount === null ? "-" : `${candidate.criminalRecordCount}건` },
    { label: "공보", value: formatDocumentStatus(candidate.pamphletPdf?.status) },
    { label: "5대공약", value: formatDocumentStatus(candidate.pledgePdf?.status) },
    { label: "사진", value: candidate.photoUrl ? "제공" : "-" },
    { label: "공개자료", value: candidate.disclosureViewerUrl ? "제공" : "-" }
  ];

  return (
    <dl className="mt-4 overflow-hidden rounded-md border border-line">
      {details.map((detail) => (
        <div key={detail.label} className="grid grid-cols-[96px_1fr] border-b border-line text-xs last:border-b-0">
          <dt className="bg-paper px-3 py-2 font-semibold text-muted">{detail.label}</dt>
          <dd className="min-w-0 whitespace-pre-line px-3 py-2 leading-5">
            {detail.type === "party" ? <PartyBadge partyName={detail.value} /> : detail.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PartyBadge({ partyName }: { partyName: string }) {
  const color = getPartyColor(partyName);

  return (
    <span
      className="inline-flex max-w-[128px] shrink-0 items-center rounded-full border px-2 py-1 text-xs font-semibold leading-none"
      style={{ backgroundColor: color.background, borderColor: color.border, color: color.text }}
      title={partyName}
    >
      <span className="truncate">{partyName}</span>
    </span>
  );
}

function formatDocumentStatus(status: CandidateDocument["status"] | undefined) {
  if (status === "available") {
    return "제공";
  }

  if (status === "pending") {
    return "공개 예정";
  }

  return "-";
}

function formatCollectedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function getRegionStepLabel(region: Region, parentRegion: Region | null) {
  if (!parentRegion) {
    return region.displayName;
  }

  if (region.displayName.startsWith(parentRegion.displayName)) {
    const label = region.displayName.slice(parentRegion.displayName.length).trim();

    return label || region.displayName;
  }

  return region.displayName;
}

function persistDashboardSelection(selection: DashboardSelection) {
  if (typeof window === "undefined") {
    return;
  }

  const serializedSelection = JSON.stringify(selection);

  try {
    window.localStorage.setItem(dashboardSelectionStorageKey, serializedSelection);
  } catch {
    // Storage can be unavailable in private browsing or restricted webviews.
  }
}

function clearLegacyDashboardSelectionCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${legacyDashboardSelectionCookieName}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function replaceDashboardSelectionUrl(selection: DashboardSelection) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(dashboardSelectionRegionParamName, selection.regionSlug);
  updateOptionalSearchParam(url, dashboardSelectionAreaParamName, selection.areaId);
  updateOptionalSearchParam(url, dashboardSelectionElectionParamName, selection.electionId);

  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function updateOptionalSearchParam(url: URL, name: string, value: string) {
  if (value) {
    url.searchParams.set(name, value);
    return;
  }

  url.searchParams.delete(name);
}

function readDashboardSelectionUrl(): Partial<DashboardSelection> | null {
  if (typeof window === "undefined") {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const regionSlug = params.get(dashboardSelectionRegionParamName) ?? undefined;
  const areaId = params.get(dashboardSelectionAreaParamName) ?? undefined;
  const electionId = params.get(dashboardSelectionElectionParamName) ?? undefined;

  if (!regionSlug && !areaId && !electionId) {
    return null;
  }

  return {
    regionSlug,
    areaId,
    electionId
  };
}

function readPersistedDashboardSelection(): Partial<DashboardSelection> | null {
  if (typeof window === "undefined") {
    return null;
  }

  return readDashboardSelectionFromStorage();
}

function readDashboardSelectionFromStorage(): Partial<DashboardSelection> | null {
  try {
    return parseDashboardSelection(window.localStorage.getItem(dashboardSelectionStorageKey));
  } catch {
    return null;
  }
}

function parseDashboardSelection(value: string | null | undefined): Partial<DashboardSelection> | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<DashboardSelection>;

    return {
      regionSlug: parsed.regionSlug,
      areaId: parsed.areaId,
      electionId: parsed.electionId
    };
  } catch {
    return null;
  }
}

function areDashboardSelectionsEqual(first: DashboardSelection, second: DashboardSelection) {
  return first.regionSlug === second.regionSlug && first.areaId === second.areaId && first.electionId === second.electionId;
}

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

function normalizeDashboardSelection(dataset: DashboardDataset, selection: Partial<DashboardSelection>): DashboardSelection {
  const regionSlug =
    selection.regionSlug && dataset.regions.some((item) => item.slug === selection.regionSlug) ? selection.regionSlug : selectedRegionSlug;
  const region = getRegionBySlug(dataset, regionSlug);
  const regionElections = getRegionElections(dataset, region.id);
  const subregionOptions = getSubregionOptions(dataset.regions, region);
  const areaOptions = getAdministrativeAreaOptions(region.slug);
  const areaId = areaOptions.some((option) => option.id === selection.areaId) ? selection.areaId ?? "" : "";
  const area = getAdministrativeAreaOption(region.slug, areaId);
  const isSubregionSelectionMissing = subregionOptions.length > 0;
  const isAreaSelectionMissing = areaOptions.length > 0 && !area;
  const isElectionSelectionBlocked = isSubregionSelectionMissing || isAreaSelectionMissing;
  const elections = isElectionSelectionBlocked
    ? []
    : areaOptions.length > 0
      ? filterElectionsByAdministrativeArea(regionElections, area)
      : regionElections;
  const electionId = elections.some((item) => item.id === selection.electionId) ? selection.electionId ?? "" : elections[0]?.id ?? "";

  return {
    regionSlug,
    areaId,
    electionId
  };
}

function DocumentLink({
  isInteractive,
  label,
  url,
  status
}: {
  isInteractive: boolean;
  label: string;
  url?: string | null;
  status?: "available" | "pending" | "missing";
}) {
  if (status === "available" && url) {
    if (!isInteractive) {
      return (
        <span className="flex items-center justify-center gap-1 rounded-md border border-line px-2 py-2 text-muted">
          <FileText size={14} />
          {label}
        </span>
      );
    }

    const href = getDocumentLinkHref(url, label, getCurrentDashboardReturnPath());
    const isExternalLink = href.startsWith("http://") || href.startsWith("https://");
    const className = "flex items-center justify-center gap-1 rounded-md bg-civic px-2 py-2 text-white";

    if (!isExternalLink) {
      return (
        <Link href={href} className={className} onClick={storeDashboardReturnScroll} onPointerDown={storeDashboardReturnScroll}>
          <FileText size={14} />
          {label}
        </Link>
      );
    }

    return (
      <a
        href={href}
        className={className}
        target="_blank"
        rel="noreferrer"
      >
        <FileText size={14} />
        {label}
      </a>
    );
  }

  if (status === "pending") {
    return (
      <span className="flex items-center justify-center gap-1 rounded-md border border-line px-2 py-2 text-muted">
        <CheckCircle2 size={14} />
        예정
      </span>
    );
  }

  return <span className="rounded-md border border-line px-2 py-2 text-muted">없음</span>;
}

function getDocumentLinkHref(url: string, label: string, returnTo?: string) {
  if (parseAllowedDocumentUrl(url)) {
    return getDocumentPreviewPath(url, label, returnTo);
  }

  return url;
}

function getCurrentDashboardReturnPath() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function storeDashboardReturnScroll() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      dashboardReturnScrollStorageKey,
      JSON.stringify({
        path: getCurrentDashboardReturnPath(),
        scrollY: window.scrollY,
        updatedAt: Date.now()
      })
    );
  } catch {
    // Session storage can be unavailable in private browsing or restricted webviews.
  }
}

function restoreDashboardReturnScroll() {
  if (typeof window === "undefined") {
    return false;
  }

  const snapshot = readDashboardReturnScroll();

  if (!snapshot) {
    return false;
  }

  if (snapshot.path !== getCurrentDashboardReturnPath()) {
    return false;
  }

  removeDashboardReturnScroll();

  const targetScrollY = Math.max(0, snapshot.scrollY);
  let attempts = 0;

  function scrollWhenReady() {
    attempts += 1;

    const maxScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const canReachTarget = maxScrollY >= targetScrollY;

    if (canReachTarget || attempts >= 12) {
      window.scrollTo({ top: Math.min(targetScrollY, maxScrollY), left: 0, behavior: "auto" });
      return;
    }

    window.requestAnimationFrame(scrollWhenReady);
  }

  window.requestAnimationFrame(scrollWhenReady);
  return true;
}

function readDashboardReturnScroll(): { path: string; scrollY: number } | null {
  try {
    const value = window.sessionStorage.getItem(dashboardReturnScrollStorageKey);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as { path?: unknown; scrollY?: unknown; updatedAt?: unknown };
    const isExpired = typeof parsed.updatedAt === "number" && Date.now() - parsed.updatedAt > 1000 * 60 * 10;

    if (isExpired) {
      removeDashboardReturnScroll();
      return null;
    }

    if (typeof parsed.path !== "string" || typeof parsed.scrollY !== "number") {
      return null;
    }

    return {
      path: parsed.path,
      scrollY: parsed.scrollY
    };
  } catch {
    return null;
  }
}

function removeDashboardReturnScroll() {
  try {
    window.sessionStorage.removeItem(dashboardReturnScrollStorageKey);
  } catch {
    // Session storage can be unavailable in private browsing or restricted webviews.
  }
}

function subscribeToInteractiveState() {
  return () => undefined;
}

function getInteractiveSnapshot() {
  return true;
}

function getServerInteractiveSnapshot() {
  return false;
}
