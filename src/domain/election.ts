import type {
  Candidate,
  CandidateComparison,
  CandidateDocument,
  Dataset,
  Election,
  ElectionDetail,
  OfficialSource,
  QuickFact
} from "./types";

export function getRegionBySlug(dataset: Dataset, slug: string) {
  const region = dataset.regions.find((item) => item.slug === slug);

  if (!region) {
    throw new Error(`Unknown region slug: ${slug}`);
  }

  return region;
}

export function getRegionElections(dataset: Dataset, regionId: string): Election[] {
  return dataset.elections
    .filter((election) => election.regionIds.includes(regionId))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ko"));
}

export function getElectionDetail(dataset: Dataset, electionId: string): ElectionDetail {
  const election = dataset.elections.find((item) => item.id === electionId);

  if (!election) {
    throw new Error(`Unknown election id: ${electionId}`);
  }

  return {
    ...election,
    candidates: dataset.candidates
      .filter((candidate) => candidate.electionId === election.id)
      .sort(compareCandidatesObjectively)
  };
}

export function getCandidateQuickFacts(candidate: Candidate): QuickFact[] {
  const pledgeItems = candidate.pledgeItems ?? [];

  return [
    { label: "정당", value: candidate.partyName },
    { label: "직업", value: candidate.job },
    { label: "공약", value: pledgeItems.length > 0 ? `${pledgeItems.length}개` : formatDocumentStatus(candidate.pledgePdf?.status) },
    { label: "공보", value: formatDocumentStatus(candidate.pamphletPdf?.status) }
  ];
}

export function buildCandidateComparison(candidates: Candidate[]): CandidateComparison {
  const ordered = [...candidates].sort(compareCandidatesObjectively);
  const rows = [
    row("정당", ordered, (candidate) => candidate.partyName),
    ...buildPledgeCategoryRows(ordered),
    row("직업", ordered, (candidate) => candidate.job),
    row("학력", ordered, (candidate) => candidate.education),
    row("공보", ordered, (candidate) => formatDocumentStatus(candidate.pamphletPdf?.status)),
    row("5대공약", ordered, (candidate) => formatDocumentStatus(candidate.pledgePdf?.status)),
    row("재산", ordered, (candidate) => candidate.assets?.display ?? "-"),
    row("병역", ordered, (candidate) => candidate.military ?? "-"),
    row("납세", ordered, (candidate) => candidate.taxPaid?.display ?? "-"),
    row("체납", ordered, (candidate) => candidate.taxArrearsCurrent?.display ?? "-"),
    row("전과", ordered, (candidate) => formatCriminalRecord(candidate.criminalRecordCount))
  ];

  return {
    candidates: ordered,
    rows,
    sources: dedupeSources(ordered.map((candidate) => candidate.source))
  };
}

function buildPledgeCategoryRows(candidates: Candidate[]) {
  const categoryOrder = ["교통", "주거/도시", "교육/돌봄", "복지/보건", "지역경제/일자리", "안전/환경", "행정/재정", "기타"];
  const availableCategories = new Set(candidates.flatMap((candidate) => (candidate.pledgeItems ?? []).map((pledge) => pledge.category)));
  const orderedCategories = categoryOrder.filter((category) => availableCategories.has(category));

  return orderedCategories.map((category) =>
    row(`공약(${category})`, candidates, (candidate) => formatPledgesByCategory(candidate, category))
  );
}

function formatPledgesByCategory(candidate: Candidate, category: string) {
  const titles = (candidate.pledgeItems ?? [])
    .filter((pledge) => pledge.category === category)
    .map((pledge) => pledge.title);

  return titles.length > 0 ? titles.join("\n") : "-";
}

function compareCandidatesObjectively(a: Candidate, b: Candidate) {
  const ballotA = a.ballotNumber ?? Number.MAX_SAFE_INTEGER;
  const ballotB = b.ballotNumber ?? Number.MAX_SAFE_INTEGER;
  const sortA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const sortB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;

  return ballotA - ballotB || sortA - sortB || a.name.localeCompare(b.name, "ko") || a.partyName.localeCompare(b.partyName, "ko");
}

function row(label: string, candidates: Candidate[], getValue: (candidate: Candidate) => string) {
  return {
    label,
    values: candidates.map(getValue)
  };
}

function formatCriminalRecord(count: number | null) {
  if (count === null) {
    return "-";
  }

  return `${count}건`;
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

function dedupeSources(sources: OfficialSource[]) {
  const unique = new Map<string, OfficialSource>();

  for (const source of sources) {
    unique.set(`${source.label}:${source.url}:${source.fetchedAt}`, source);
  }

  return [...unique.values()];
}
