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
import { sampleDataset } from "@/domain/sample-data";
import { LocationAssist } from "@/components/location-assist";

const selectedRegionSlug = "seoul-mapo-seogyo";
const initialElectionId = "seoul-mayor";

export function ElectionDashboard() {
  const region = getRegionBySlug(sampleDataset, selectedRegionSlug);
  const elections = getRegionElections(sampleDataset, region.id);
  const [selectedElectionId, setSelectedElectionId] = useState(initialElectionId);
  const election = getElectionDetail(sampleDataset, selectedElectionId);
  const comparison = useMemo(() => buildCandidateComparison(election.candidates.slice(0, 2)), [election.candidates]);

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
        <LocationAssist />
      </section>

      <section className="border-y border-line bg-white px-5 py-4">
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 shrink-0 text-civic" size={20} />
          <div>
            <p className="text-xs font-semibold text-muted">현재 선택 지역 · 데모 데이터</p>
            <h2 className="mt-1 text-lg font-bold">{region.displayName}</h2>
            <p className="mt-1 text-xs leading-5 text-muted">{region.notice}</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              위치 확인은 좌표까지만 동작합니다. 동탄 후보를 보려면 주소-선거구 매핑 데이터와 화성시 후보 데이터가 필요합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 py-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">확인할 선거</h2>
          <span className="text-xs text-muted">{elections.length}개</span>
        </div>
        <div className="mt-3 space-y-2">
          {elections.map((item) => {
            const isSelected = item.id === selectedElectionId;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedElectionId(item.id)}
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
                      <p className="text-xs font-semibold text-muted">기호 {candidate.ballotNumber ?? "-"}</p>
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
              <p className="mt-3 text-[11px] leading-4 text-muted">
                출처: {candidate.source.label} · 수집 {candidate.source.fetchedAt}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-5">
        <h2 className="text-base font-bold">빠른 비교</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-white">
          <div className="grid grid-cols-[88px_1fr_1fr] border-b border-line bg-paper text-xs font-bold">
            <div className="px-3 py-2">항목</div>
            {comparison.candidates.map((candidate) => (
              <div key={candidate.id} className="px-3 py-2">
                {candidate.name}
              </div>
            ))}
          </div>
          {comparison.rows.slice(0, 8).map((row) => (
            <div key={row.label} className="grid grid-cols-[88px_1fr_1fr] border-b border-line text-xs last:border-b-0">
              <div className="bg-paper px-3 py-2 font-semibold text-muted">{row.label}</div>
              {row.values.map((value, index) => (
                <div key={`${row.label}-${index}`} className="px-3 py-2 leading-5">
                  {value}
                </div>
              ))}
            </div>
          ))}
        </div>
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
