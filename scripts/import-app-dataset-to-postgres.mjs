import { readFile } from "node:fs/promises";
import pg from "pg";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Example: postgresql://before_you_vote:before_you_vote@localhost:5432/before_you_vote");
}

const schemaSql = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
const dataset = JSON.parse(await readFile(new URL("../data/nec/app-election-dataset-20260603.json", import.meta.url), "utf8"));
const documents = await readOptionalJson("../data/nec/candidate-documents-20260603.json");

const pool = new Pool({ connectionString: DATABASE_URL });
const client = await pool.connect();

try {
  await client.query("BEGIN");
  await client.query(schemaSql);
  await truncateTables();
  await insertCollectionRun();
  await insertRegions();
  await insertElections();
  await insertCandidates();
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}

console.log(
  `Imported ${dataset.regions.length} regions, ${dataset.elections.length} elections, ` +
    `${dataset.candidates.length} candidates into PostgreSQL.`
);

async function truncateTables() {
  await client.query(`
    TRUNCATE TABLE
      candidate_documents,
      candidate_pledges,
      candidate_details,
      candidates,
      election_regions,
      elections,
      regions,
      collection_runs
    RESTART IDENTITY CASCADE
  `);
}

async function insertCollectionRun() {
  const source = firstSource();

  await client.query(
    `
      INSERT INTO collection_runs (source_name, source_url, fetched_at, metadata)
      VALUES ($1, $2, $3, $4::jsonb)
    `,
    [
      source.label,
      source.url,
      source.fetchedAt,
      JSON.stringify({
        regionCount: dataset.regions.length,
        electionCount: dataset.elections.length,
        candidateCount: dataset.candidates.length,
        documentStats: documents?.stats ?? null
      })
    ]
  );
}

async function insertRegions() {
  for (const region of dataset.regions) {
    await client.query(
      `
        INSERT INTO regions (id, slug, display_name, sido, sigungu, eupmyeondong, notice)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [region.id, region.slug, region.displayName, region.sido, region.sigungu, region.eupmyeondong, region.notice]
    );
  }
}

async function insertElections() {
  for (const election of dataset.elections) {
    await client.query(
      `
        INSERT INTO elections (id, title, category, district_name, ballot_name, sort_order)
        VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [election.id, election.title, election.category, election.districtName, election.ballotName, election.sortOrder]
    );

    for (const regionId of election.regionIds) {
      await client.query(
        `
          INSERT INTO election_regions (election_id, region_id)
          VALUES ($1, $2)
        `,
        [election.id, regionId]
      );
    }
  }
}

async function insertCandidates() {
  for (const candidate of dataset.candidates) {
    await client.query(
      `
        INSERT INTO candidates (
          id,
          election_id,
          hubo_id,
          name,
          party_name,
          ballot_number,
          sort_order,
          job,
          education,
          career,
          photo_url,
          disclosure_viewer_url,
          source_label,
          source_url,
          source_fetched_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
      [
        candidate.id,
        candidate.electionId,
        extractHuboId(candidate.id),
        candidate.name,
        candidate.partyName,
        candidate.ballotNumber,
        candidate.sortOrder ?? null,
        candidate.job,
        candidate.education,
        candidate.career,
        candidate.photoUrl,
        candidate.disclosureViewerUrl,
        candidate.source.label,
        candidate.source.url,
        candidate.source.fetchedAt
      ]
    );

    await client.query(
      `
        INSERT INTO candidate_details (
          candidate_id,
          assets_amount_krw,
          assets_display,
          military,
          tax_paid_amount_krw,
          tax_paid_display,
          tax_arrears_last_five_years_amount_krw,
          tax_arrears_last_five_years_display,
          tax_arrears_current_amount_krw,
          tax_arrears_current_display,
          criminal_record_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        candidate.id,
        candidate.assets?.amountKrw ?? null,
        candidate.assets?.display ?? null,
        candidate.military,
        candidate.taxPaid?.amountKrw ?? null,
        candidate.taxPaid?.display ?? null,
        candidate.taxArrearsLastFiveYears?.amountKrw ?? null,
        candidate.taxArrearsLastFiveYears?.display ?? null,
        candidate.taxArrearsCurrent?.amountKrw ?? null,
        candidate.taxArrearsCurrent?.display ?? null,
        candidate.criminalRecordCount
      ]
    );

    await insertDocument(candidate.id, "pamphlet", candidate.pamphletPdf);
    await insertDocument(candidate.id, "pledge", candidate.pledgePdf);
    await insertPledges(candidate.id, candidate.pledgeItems ?? []);
  }
}

async function insertDocument(candidateId, type, document) {
  if (!document) {
    return;
  }

  await client.query(
    `
      INSERT INTO candidate_documents (candidate_id, document_type, label, url, status)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [candidateId, type, document.label, document.url, document.status]
  );
}

async function insertPledges(candidateId, pledgeItems) {
  for (const [index, pledge] of pledgeItems.entries()) {
    await client.query(
      `
        INSERT INTO candidate_pledges (
          candidate_id,
          pledge_order,
          title,
          category,
          content,
          source_url,
          fetched_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [candidateId, index + 1, pledge.title, pledge.category, pledge.content, pledge.sourceUrl, pledge.fetchedAt]
    );
  }
}

async function readOptionalJson(path) {
  return readFile(new URL(path, import.meta.url), "utf8")
    .then(JSON.parse)
    .catch(() => null);
}

function firstSource() {
  return (
    dataset.candidates.find((candidate) => candidate.source)?.source ?? {
      label: "중앙선거관리위원회",
      url: "https://www.nec.go.kr",
      fetchedAt: new Date().toISOString()
    }
  );
}

function extractHuboId(candidateId) {
  return String(candidateId).split("-").at(-1);
}
