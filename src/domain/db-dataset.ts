import type { CandidateDocument, Dataset, MoneySummary, OfficialSource } from "./types";

export type DbRegionRow = {
  id: string;
  slug: string;
  display_name: string;
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  notice: string;
};

export type DbElectionRow = {
  id: string;
  title: string;
  category: string;
  district_name: string;
  ballot_name: string;
  sort_order: number;
  region_ids: string[] | null;
};

export type DbCandidateRow = {
  id: string;
  election_id: string;
  name: string;
  party_name: string;
  ballot_number: number | null;
  sort_order: number | null;
  job: string;
  education: string;
  career: string;
  assets_amount_krw: string | number | null;
  assets_display: string | null;
  military: string | null;
  tax_paid_amount_krw: string | number | null;
  tax_paid_display: string | null;
  tax_arrears_last_five_years_amount_krw: string | number | null;
  tax_arrears_last_five_years_display: string | null;
  tax_arrears_current_amount_krw: string | number | null;
  tax_arrears_current_display: string | null;
  criminal_record_count: number | null;
  photo_url: string | null;
  pamphlet_label: string | null;
  pamphlet_url: string | null;
  pamphlet_status: CandidateDocument["status"] | null;
  pledge_label: string | null;
  pledge_url: string | null;
  pledge_status: CandidateDocument["status"] | null;
  disclosure_viewer_url: string | null;
  source_label: string;
  source_url: string;
  source_fetched_at: Date | string;
};

export type DbDatasetRows = {
  regions: DbRegionRow[];
  elections: DbElectionRow[];
  candidates: DbCandidateRow[];
};

export function mapDbRowsToDataset(rows: DbDatasetRows): Dataset {
  return {
    regions: rows.regions.map((region) => ({
      id: region.id,
      slug: region.slug,
      displayName: region.display_name,
      sido: region.sido,
      sigungu: region.sigungu,
      eupmyeondong: region.eupmyeondong,
      notice: region.notice
    })),
    elections: rows.elections.map((election) => ({
      id: election.id,
      regionIds: election.region_ids ?? [],
      title: election.title,
      category: election.category,
      districtName: election.district_name,
      ballotName: election.ballot_name,
      sortOrder: election.sort_order
    })),
    candidates: rows.candidates.map((candidate) => ({
      id: candidate.id,
      electionId: candidate.election_id,
      name: candidate.name,
      partyName: candidate.party_name,
      ballotNumber: candidate.ballot_number,
      sortOrder: candidate.sort_order ?? undefined,
      job: candidate.job,
      education: candidate.education,
      career: candidate.career,
      assets: toMoneySummary(candidate.assets_amount_krw, candidate.assets_display),
      military: candidate.military,
      taxPaid: toMoneySummary(candidate.tax_paid_amount_krw, candidate.tax_paid_display),
      taxArrearsLastFiveYears: toMoneySummary(
        candidate.tax_arrears_last_five_years_amount_krw,
        candidate.tax_arrears_last_five_years_display
      ),
      taxArrearsCurrent: toMoneySummary(candidate.tax_arrears_current_amount_krw, candidate.tax_arrears_current_display),
      criminalRecordCount: candidate.criminal_record_count,
      photoUrl: candidate.photo_url,
      pamphletPdf: toDocument(candidate.pamphlet_label, candidate.pamphlet_url, candidate.pamphlet_status),
      pledgePdf: toDocument(candidate.pledge_label, candidate.pledge_url, candidate.pledge_status),
      disclosureViewerUrl: candidate.disclosure_viewer_url,
      source: toSource(candidate.source_label, candidate.source_url, candidate.source_fetched_at)
    }))
  };
}

function toMoneySummary(amount: string | number | null, display: string | null): MoneySummary | null {
  if (amount === null || display === null) {
    return null;
  }

  const amountKrw = Number(amount);
  return Number.isFinite(amountKrw) ? { amountKrw, display } : null;
}

function toDocument(
  label: string | null,
  url: string | null,
  status: CandidateDocument["status"] | null
): CandidateDocument | null {
  if (!label || !status) {
    return null;
  }

  return {
    label,
    url: url ?? "",
    status
  };
}

function toSource(label: string, url: string, fetchedAt: Date | string): OfficialSource {
  return {
    label,
    url,
    fetchedAt: fetchedAt instanceof Date ? fetchedAt.toISOString() : fetchedAt
  };
}
