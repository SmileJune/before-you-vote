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
  return [
    { label: "직업", value: candidate.job },
    { label: "재산", value: candidate.assets?.display ?? "자료 없음" },
    { label: "병역", value: candidate.military ?? "자료 없음" },
    { label: "체납", value: candidate.taxArrearsCurrent?.display ?? "자료 없음" },
    { label: "전과", value: formatCriminalRecord(candidate.criminalRecordCount) }
  ];
}

export function buildCandidateComparison(candidates: Candidate[]): CandidateComparison {
  const ordered = [...candidates].sort(compareCandidatesObjectively);
  const rows = [
    row("정당", ordered, (candidate) => candidate.partyName),
    row("직업", ordered, (candidate) => candidate.job),
    row("학력", ordered, (candidate) => candidate.education),
    row("재산", ordered, (candidate) => candidate.assets?.display ?? "자료 없음"),
    row("병역", ordered, (candidate) => candidate.military ?? "자료 없음"),
    row("납세", ordered, (candidate) => candidate.taxPaid?.display ?? "자료 없음"),
    row("체납", ordered, (candidate) => candidate.taxArrearsCurrent?.display ?? "자료 없음"),
    row("전과", ordered, (candidate) => formatCriminalRecord(candidate.criminalRecordCount)),
    row("공보", ordered, (candidate) => formatDocumentStatus(candidate.pamphletPdf?.status)),
    row("5대공약", ordered, (candidate) => formatDocumentStatus(candidate.pledgePdf?.status))
  ];

  return {
    candidates: ordered,
    rows,
    sources: dedupeSources(ordered.map((candidate) => candidate.source))
  };
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
    return "자료 없음";
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

  return "미제출/없음";
}

function dedupeSources(sources: OfficialSource[]) {
  const unique = new Map<string, OfficialSource>();

  for (const source of sources) {
    unique.set(`${source.label}:${source.url}:${source.fetchedAt}`, source);
  }

  return [...unique.values()];
}
