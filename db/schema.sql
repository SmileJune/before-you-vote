CREATE TABLE IF NOT EXISTS collection_runs (
  id BIGSERIAL PRIMARY KEY,
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sido TEXT NOT NULL,
  sigungu TEXT NOT NULL,
  eupmyeondong TEXT NOT NULL DEFAULT '',
  notice TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS elections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  district_name TEXT NOT NULL,
  ballot_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS election_regions (
  election_id TEXT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  region_id TEXT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  PRIMARY KEY (election_id, region_id)
);

CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  election_id TEXT NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  hubo_id TEXT NOT NULL,
  name TEXT NOT NULL,
  party_name TEXT NOT NULL,
  ballot_number INTEGER,
  sort_order INTEGER,
  job TEXT NOT NULL,
  education TEXT NOT NULL,
  career TEXT NOT NULL,
  photo_url TEXT,
  disclosure_viewer_url TEXT,
  source_label TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_fetched_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS candidates_election_id_idx ON candidates(election_id);
CREATE INDEX IF NOT EXISTS candidates_hubo_id_idx ON candidates(hubo_id);
CREATE INDEX IF NOT EXISTS candidates_name_idx ON candidates(name);

CREATE TABLE IF NOT EXISTS candidate_details (
  candidate_id TEXT PRIMARY KEY REFERENCES candidates(id) ON DELETE CASCADE,
  assets_amount_krw BIGINT,
  assets_display TEXT,
  military TEXT,
  tax_paid_amount_krw BIGINT,
  tax_paid_display TEXT,
  tax_arrears_last_five_years_amount_krw BIGINT,
  tax_arrears_last_five_years_display TEXT,
  tax_arrears_current_amount_krw BIGINT,
  tax_arrears_current_display TEXT,
  criminal_record_count INTEGER
);

CREATE TABLE IF NOT EXISTS candidate_documents (
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('pamphlet', 'pledge')),
  label TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('available', 'pending', 'missing')),
  PRIMARY KEY (candidate_id, document_type)
);
