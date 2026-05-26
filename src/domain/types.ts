export type Dataset = {
  regions: Region[];
  elections: Election[];
  candidates: Candidate[];
};

export type Region = {
  id: string;
  slug: string;
  displayName: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  notice: string;
};

export type Election = {
  id: string;
  regionIds: string[];
  title: string;
  category: string;
  districtName: string;
  ballotName: string;
  sortOrder: number;
};

export type Candidate = {
  id: string;
  electionId: string;
  name: string;
  partyName: string;
  ballotNumber: number | null;
  job: string;
  education: string;
  career: string;
  assets: MoneySummary | null;
  military: string | null;
  taxPaid: MoneySummary | null;
  taxArrearsLastFiveYears: MoneySummary | null;
  taxArrearsCurrent: MoneySummary | null;
  criminalRecordCount: number | null;
  photoUrl: string | null;
  pamphletPdf: CandidateDocument | null;
  pledgePdf: CandidateDocument | null;
  disclosureViewerUrl: string | null;
  source: OfficialSource;
};

export type MoneySummary = {
  amountKrw: number;
  display: string;
};

export type CandidateDocument = {
  label: string;
  url: string;
  status: "available" | "pending" | "missing";
};

export type OfficialSource = {
  label: string;
  url: string;
  fetchedAt: string;
};

export type ElectionDetail = Election & {
  candidates: Candidate[];
};

export type QuickFact = {
  label: string;
  value: string;
};

export type CandidateComparison = {
  candidates: Candidate[];
  rows: ComparisonRow[];
  sources: OfficialSource[];
};

export type ComparisonRow = {
  label: string;
  values: string[];
};
