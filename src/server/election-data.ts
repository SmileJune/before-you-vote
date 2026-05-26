import { electionDataset } from "@/domain/generated-election-data";
import { mapDbRowsToDataset, type DbCandidateRow, type DbElectionRow, type DbRegionRow } from "@/domain/db-dataset";
import type { Dataset } from "@/domain/types";

export async function loadElectionDataset(): Promise<Dataset> {
  if (!process.env.DATABASE_URL) {
    return electionDataset;
  }

  try {
    return await loadElectionDatasetFromPostgres(process.env.DATABASE_URL);
  } catch (error) {
    console.error("Failed to load election dataset from PostgreSQL. Falling back to generated JSON.", error);
    return electionDataset;
  }
}

async function loadElectionDatasetFromPostgres(connectionString: string): Promise<Dataset> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString });

  try {
    const [regions, elections, candidates] = await Promise.all([
      pool.query<DbRegionRow>(`
        SELECT id, slug, display_name, sido, sigungu, eupmyeondong, notice
        FROM regions
        ORDER BY sido, sigungu, display_name
      `),
      pool.query<DbElectionRow>(`
        SELECT
          e.id,
          e.title,
          e.category,
          e.district_name,
          e.ballot_name,
          e.sort_order,
          COALESCE(array_agg(er.region_id ORDER BY er.region_id) FILTER (WHERE er.region_id IS NOT NULL), '{}') AS region_ids
        FROM elections e
        LEFT JOIN election_regions er ON er.election_id = e.id
        GROUP BY e.id
        ORDER BY e.sort_order, e.title
      `),
      pool.query<DbCandidateRow>(`
        SELECT
          c.id,
          c.election_id,
          c.name,
          c.party_name,
          c.ballot_number,
          c.sort_order,
          c.job,
          c.education,
          c.career,
          d.assets_amount_krw,
          d.assets_display,
          d.military,
          d.tax_paid_amount_krw,
          d.tax_paid_display,
          d.tax_arrears_last_five_years_amount_krw,
          d.tax_arrears_last_five_years_display,
          d.tax_arrears_current_amount_krw,
          d.tax_arrears_current_display,
          d.criminal_record_count,
          c.photo_url,
          pamphlet.label AS pamphlet_label,
          pamphlet.url AS pamphlet_url,
          pamphlet.status AS pamphlet_status,
          pledge.label AS pledge_label,
          pledge.url AS pledge_url,
          pledge.status AS pledge_status,
          c.disclosure_viewer_url,
          c.source_label,
          c.source_url,
          c.source_fetched_at,
          COALESCE(
            jsonb_agg(
              jsonb_build_object(
                'title', cp.title,
                'category', cp.category,
                'content', cp.content,
                'sourceUrl', cp.source_url,
                'fetchedAt', cp.fetched_at
              )
              ORDER BY cp.pledge_order
            ) FILTER (WHERE cp.id IS NOT NULL),
            '[]'::jsonb
          ) AS pledge_items
        FROM candidates c
        LEFT JOIN candidate_details d ON d.candidate_id = c.id
        LEFT JOIN candidate_documents pamphlet ON pamphlet.candidate_id = c.id AND pamphlet.document_type = 'pamphlet'
        LEFT JOIN candidate_documents pledge ON pledge.candidate_id = c.id AND pledge.document_type = 'pledge'
        LEFT JOIN candidate_pledges cp ON cp.candidate_id = c.id
        GROUP BY
          c.id,
          d.candidate_id,
          pamphlet.candidate_id,
          pamphlet.document_type,
          pamphlet.label,
          pamphlet.url,
          pamphlet.status,
          pledge.candidate_id,
          pledge.document_type,
          pledge.label,
          pledge.url,
          pledge.status
        ORDER BY c.election_id, c.ballot_number NULLS LAST, c.sort_order NULLS LAST, c.name
      `)
    ]);

    return mapDbRowsToDataset({
      regions: regions.rows,
      elections: elections.rows,
      candidates: candidates.rows
    });
  } finally {
    await pool.end();
  }
}
