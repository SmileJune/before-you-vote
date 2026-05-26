"use client";

import { AlertCircle, CheckCircle2, ChevronRight, FileText, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  buildCandidateComparison,
  getElectionDetail,
  getRegionBySlug,
  getRegionElections
} from "@/domain/election";
import {
  filterElectionsByAdministrativeArea,
  getAdministrativeAreaOption,
  getAdministrativeAreaOptions
} from "@/domain/district-mapping";
import { resolveReverseGeocodedRegion, type ReverseGeocodedRegion } from "@/domain/reverse-geocode";
import type { Candidate, CandidateDocument, Dataset } from "@/domain/types";
import { LocationAssist } from "@/components/location-assist";
import { getPartyColor } from "@/domain/party-colors";

const selectedRegionSlug = "seoul-mapo-seogyo";
const dashboardSelectionStorageKey = "before-you-vote:dashboard-selection";
const dashboardSelectionCookieName = "before-you-vote-dashboard-selection";
const dashboardSelectionCookieMaxAgeSeconds = 60 * 60 * 24 * 180;

type DashboardSelection = {
  regionSlug: string;
  areaId: string;
  electionId: string;
};

type ElectionDashboardProps = {
  dataset: Dataset;
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
  const regionElections = getRegionElections(dataset, region.id);
  const subregionOptions = getSubregionOptions(dataset, region);
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
  const election = activeElectionId ? getElectionDetail(dataset, activeElectionId) : null;
  const comparison = useMemo(() => buildCandidateComparison(election?.candidates ?? []), [election]);
  const comparisonGridStyle = useMemo(
    () => ({
      gridTemplateColumns: `88px repeat(${comparison.candidates.length}, minmax(120px, 1fr))`,
      minWidth: `max(100%, ${88 + comparison.candidates.length * 120}px)`
    }),
    [comparison.candidates.length]
  );
  const regionsBySido = useMemo(() => {
    const grouped = new Map<string, Dataset["regions"]>();

    for (const item of dataset.regions) {
      grouped.set(item.sido, [...(grouped.get(item.sido) ?? []), item]);
    }

    return [...grouped.entries()];
  }, [dataset.regions]);

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
    const nextSubregionOptions = getSubregionOptions(dataset, nextRegion);
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

  function updateSelection(nextSelection: DashboardSelection) {
    setSelection(nextSelection);
    persistDashboardSelection(nextSelection);
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
          <label htmlFor="region-select" className="text-xs font-semibold text-muted">
            지역 직접 선택
          </label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(event) => handleRegionSelected(event.target.value)}
            className="mt-2 w-full rounded-md border border-line bg-paper px-3 py-3 text-sm font-semibold text-ink"
          >
            {regionsBySido.map(([sido, items]) => (
              <optgroup key={sido} label={sido}>
                {items.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.displayName}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {subregionOptions.length > 0 ? (
          <div className="mt-4 rounded-md border border-line bg-paper p-3">
            <label htmlFor="subregion-select" className="text-xs font-semibold text-muted">
              세부 지역 선택
            </label>
            <select
              id="subregion-select"
              value=""
              onChange={(event) => handleRegionSelected(event.target.value)}
              className="mt-2 w-full rounded-md border border-line bg-white px-3 py-3 text-sm font-semibold text-ink"
            >
              <option value="">구를 선택하세요</option>
              {subregionOptions.map((option) => (
                <option key={option.id} value={option.slug}>
                  {option.displayName}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-muted">
              같은 시 안에서도 관할 구와 읍면동에 따라 지방의원 선거구가 달라집니다.
            </p>
          </div>
        ) : areaOptions.length > 0 ? (
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
                {selectedArea.districtNames.join(", ")} 기준입니다. 출처: {selectedArea.sourceLabel}
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
            {comparison.candidates.length >= 2 ? (
              <div className="mt-3 overflow-x-auto rounded-md border border-line bg-white">
                <div className="grid border-b border-line bg-paper text-xs font-bold" style={comparisonGridStyle}>
                  <div className="sticky left-0 z-20 border-r border-line bg-paper px-3 py-2">항목</div>
                  {comparison.candidates.map((candidate) => (
                    <div key={candidate.id} className="min-w-0 px-3 py-2">
                      <span className="block truncate">{candidate.name}</span>
                    </div>
                  ))}
                </div>
                {comparison.rows.map((row) => (
                  <div
                    key={row.label}
                    className="grid border-b border-line text-xs last:border-b-0"
                    style={comparisonGridStyle}
                  >
                    <div className="sticky left-0 z-10 border-r border-line bg-paper px-3 py-2 font-semibold text-muted">{row.label}</div>
                    {row.values.map((value, index) => (
                      <div key={`${row.label}-${index}`} className="min-w-0 whitespace-pre-line px-3 py-2 leading-5">
                        {row.label === "정당" ? <PartyBadge partyName={value} /> : value}
                      </div>
                    ))}
                  </div>
                ))}
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
                        <DocumentLink label="공보" url={candidate.pamphletPdf?.url} status={candidate.pamphletPdf?.status} />
                        <DocumentLink label="5대공약" url={candidate.pledgePdf?.url} status={candidate.pledgePdf?.status} />
                        <DocumentLink label="공개자료" url={candidate.disclosureViewerUrl} status="available" />
                      </div>
                      <p className="mt-3 text-[11px] leading-4 text-muted">
                        출처: {candidate.source.label} · 수집 {formatCollectedDate(candidate.source.fetchedAt)}
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

  document.cookie = [
    `${dashboardSelectionCookieName}=${encodeURIComponent(serializedSelection)}`,
    "Path=/",
    `Max-Age=${dashboardSelectionCookieMaxAgeSeconds}`,
    "SameSite=Lax"
  ].join("; ");
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

function getSubregionOptions(dataset: Dataset, region: Dataset["regions"][number]) {
  return dataset.regions
    .filter(
      (item) =>
        item.sido === region.sido &&
        item.slug !== region.slug &&
        item.sigungu.startsWith(region.sigungu) &&
        item.sigungu.length > region.sigungu.length
    )
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "ko"));
}

function normalizeDashboardSelection(dataset: Dataset, selection: Partial<DashboardSelection>): DashboardSelection {
  const regionSlug =
    selection.regionSlug && dataset.regions.some((item) => item.slug === selection.regionSlug) ? selection.regionSlug : selectedRegionSlug;
  const region = getRegionBySlug(dataset, regionSlug);
  const regionElections = getRegionElections(dataset, region.id);
  const subregionOptions = getSubregionOptions(dataset, region);
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
  label,
  url,
  status
}: {
  label: string;
  url?: string | null;
  status?: "available" | "pending" | "missing";
}) {
  if (status === "available" && url) {
    return (
      <a
        href={url}
        className="flex items-center justify-center gap-1 rounded-md bg-civic px-2 py-2 text-white"
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
