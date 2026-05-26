"use client";

import { AlertCircle, CheckCircle2, ChevronRight, FileText, MapPin, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  buildCandidateComparison,
  getCandidateQuickFacts,
  getElectionDetail,
  getRegionBySlug,
  getRegionElections
} from "@/domain/election";
import {
  filterElectionsByAdministrativeArea,
  getAdministrativeAreaOption,
  getAdministrativeAreaOptions
} from "@/domain/district-mapping";
import type { Dataset } from "@/domain/types";
import { LocationAssist } from "@/components/location-assist";

const selectedRegionSlug = "seoul-mapo-seogyo";

type ElectionDashboardProps = {
  dataset: Dataset;
};

export function ElectionDashboard({ dataset }: ElectionDashboardProps) {
  const [selectedRegion, setSelectedRegion] = useState(selectedRegionSlug);
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [selectedComparisonIds, setSelectedComparisonIds] = useState<string[]>([]);
  const region = getRegionBySlug(dataset, selectedRegion);
  const regionElections = getRegionElections(dataset, region.id);
  const areaOptions = getAdministrativeAreaOptions(region.slug);
  const selectedArea = getAdministrativeAreaOption(region.slug, selectedAreaId);
  const elections = areaOptions.length > 0 ? filterElectionsByAdministrativeArea(regionElections, selectedArea) : regionElections;
  const [selectedElectionId, setSelectedElectionId] = useState(elections[0]?.id ?? "");
  const activeElectionId = elections.some((item) => item.id === selectedElectionId) ? selectedElectionId : elections[0]?.id ?? "";
  const election = getElectionDetail(dataset, activeElectionId);
  const comparisonCandidates = useMemo(
    () => election.candidates.filter((candidate) => selectedComparisonIds.includes(candidate.id)),
    [election.candidates, selectedComparisonIds]
  );
  const comparison = useMemo(() => buildCandidateComparison(comparisonCandidates), [comparisonCandidates]);
  const selectedComparisonIdSet = useMemo(() => new Set(selectedComparisonIds), [selectedComparisonIds]);
  const regionsBySido = useMemo(() => {
    const grouped = new Map<string, Dataset["regions"]>();

    for (const item of dataset.regions) {
      grouped.set(item.sido, [...(grouped.get(item.sido) ?? []), item]);
    }

    return [...grouped.entries()];
  }, [dataset.regions]);

  function handleRegionMapped(regionSlug: string) {
    handleRegionSelected(regionSlug);
  }

  function handleRegionSelected(regionSlug: string) {
    const nextRegion = getRegionBySlug(dataset, regionSlug);
    const nextRegionElections = getRegionElections(dataset, nextRegion.id);
    const nextAreaOptions = getAdministrativeAreaOptions(nextRegion.slug);
    const nextElections = nextAreaOptions.length > 0 ? filterElectionsByAdministrativeArea(nextRegionElections, null) : nextRegionElections;

    setSelectedRegion(regionSlug);
    setSelectedAreaId("");
    setSelectedElectionId(nextElections[0]?.id ?? "");
    setSelectedComparisonIds([]);
  }

  function handleAreaSelected(areaId: string) {
    const nextArea = getAdministrativeAreaOption(region.slug, areaId);
    const nextElections = filterElectionsByAdministrativeArea(regionElections, nextArea);

    setSelectedAreaId(areaId);
    setSelectedElectionId(nextElections[0]?.id ?? "");
    setSelectedComparisonIds([]);
  }

  function handleElectionSelected(electionId: string) {
    setSelectedElectionId(electionId);
    setSelectedComparisonIds([]);
  }

  function handleComparisonToggle(candidateId: string) {
    setSelectedComparisonIds((current) => {
      if (current.includes(candidateId)) {
        return current.filter((id) => id !== candidateId);
      }

      if (current.length >= 4) {
        return current;
      }

      return [...current, candidateId];
    });
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
            {areaOptions.length > 0 ? (
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
                {selectedArea.districtNames.join(", ")} 기준입니다. 출처: {selectedArea.sourceLabel}
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-muted">
                읍면동 선택 전에는 지방의원 지역구 선거를 숨깁니다.
              </p>
            )}
          </div>
        ) : null}
      </section>

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

      <section id={election.id} className="bg-white px-5 py-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-civic">{election.ballotName}</p>
            <h2 className="mt-1 text-xl font-bold">{election.title} 후보</h2>
          </div>
          <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">기호순</span>
        </div>

        {election.candidates.length > 0 ? (
          <div className="mt-4 space-y-3">
            {election.candidates.map((candidate) => {
              const isSelectedForComparison = selectedComparisonIdSet.has(candidate.id);
              const isComparisonLimitReached = selectedComparisonIds.length >= 4 && !isSelectedForComparison;

              return (
            <article
              key={candidate.id}
              className={`rounded-md border bg-white p-4 ${
                isSelectedForComparison ? "border-civic ring-2 ring-civic/15" : "border-line"
              }`}
            >
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
                    <span className="shrink-0 rounded-full border border-line px-2 py-1 text-xs">{candidate.partyName}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {getCandidateQuickFacts(candidate).map((fact) => (
                      <div key={fact.label} className="rounded-md bg-paper px-3 py-2">
                        <p className="text-[11px] font-semibold text-muted">{fact.label}</p>
                        <p className="mt-0.5 truncate text-sm font-semibold">{fact.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-semibold">
                <DocumentLink label="공보" url={candidate.pamphletPdf?.url} status={candidate.pamphletPdf?.status} />
                <DocumentLink label="5대공약" url={candidate.pledgePdf?.url} status={candidate.pledgePdf?.status} />
                <DocumentLink label="공개자료" url={candidate.disclosureViewerUrl} status="available" />
              </div>
              <button
                type="button"
                onClick={() => handleComparisonToggle(candidate.id)}
                disabled={isComparisonLimitReached}
                className={`mt-3 flex w-full items-center justify-center rounded-md border px-3 py-2 text-xs font-semibold ${
                  isSelectedForComparison
                    ? "border-civic bg-civic text-white"
                    : "border-line bg-paper text-ink disabled:text-muted"
                }`}
                aria-pressed={isSelectedForComparison}
              >
                {isSelectedForComparison ? "비교 선택됨" : "비교에 추가"}
              </button>
              <p className="mt-3 text-[11px] leading-4 text-muted">
                출처: {candidate.source.label} · 수집 {candidate.source.fetchedAt}
              </p>
            </article>
              );
            })}
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

      <section className="px-5 py-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold">후보 비교</h2>
          <span className="text-xs text-muted">{comparison.candidates.length}명 선택</span>
        </div>
        {comparison.candidates.length >= 2 ? (
          <div className="mt-3 overflow-x-auto rounded-md border border-line bg-white">
          <div
            className="grid border-b border-line bg-paper text-xs font-bold"
            style={{ gridTemplateColumns: `88px repeat(${comparison.candidates.length}, minmax(120px, 1fr))` }}
          >
            <div className="px-3 py-2">항목</div>
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
              style={{ gridTemplateColumns: `88px repeat(${comparison.candidates.length}, minmax(120px, 1fr))` }}
            >
              <div className="bg-paper px-3 py-2 font-semibold text-muted">{row.label}</div>
              {row.values.map((value, index) => (
                <div key={`${row.label}-${index}`} className="min-w-0 px-3 py-2 leading-5">
                  {value}
                </div>
              ))}
            </div>
          ))}
          </div>
        ) : (
          <div className="mt-3 rounded-md border border-line bg-white p-4 text-xs leading-5 text-muted">
            후보 카드에서 2명 이상을 선택하면 같은 항목으로 비교합니다. 기본으로 특정 후보를 올리지 않습니다.
          </div>
        )}
      </section>

      <footer className="bg-white px-5 py-5 text-xs leading-5 text-muted">
        <div className="flex gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>위치 기반 조회는 실제 투표구와 다를 수 있습니다. 투표안내문 주소와 다르면 직접 지역을 선택하세요.</p>
        </div>
      </footer>
    </main>
  );
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
      <a href={url} className="flex items-center justify-center gap-1 rounded-md bg-civic px-2 py-2 text-white">
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
