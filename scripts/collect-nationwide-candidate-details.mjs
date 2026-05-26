import { readFile, writeFile } from "node:fs/promises";

const ELECTION_ID = "0020260603";
const SOURCE_LABEL = "중앙선거관리위원회 선거통계시스템 후보자 상세";
const DETAIL_URL = "https://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml";
const outputUrl = new URL("../data/nec/nationwide-candidate-details-20260603.json", import.meta.url);
const nationwide = JSON.parse(await readFile(new URL("../data/nec/nationwide-candidates-20260603.json", import.meta.url), "utf8"));
const previous = await readPreviousDetails();
const fetchedAt = new Date().toISOString();
const candidates = uniqueCandidates(nationwide.candidates);
const details = { ...(previous.details ?? {}) };
const failures = [...(previous.failures ?? [])];

let completed = Object.keys(details).length;
let changedSinceLastSave = 0;

for (const candidate of candidates) {
  if (details[candidate.huboid]) {
    continue;
  }

  try {
    details[candidate.huboid] = await fetchCandidateDetail(candidate);
    completed += 1;
    changedSinceLastSave += 1;
  } catch (error) {
    failures.push({
      huboId: candidate.huboid,
      name: candidate.name,
      sdName: candidate.sdName,
      wiwName: candidate.wiwName,
      sggName: candidate.sggName,
      reason: error.message,
      failedAt: new Date().toISOString()
    });
  }

  if (changedSinceLastSave >= 100) {
    await save();
    changedSinceLastSave = 0;
    console.log(`Collected ${completed}/${candidates.length} candidate details.`);
  }
}

await save();
console.log(`Collected ${Object.keys(details).length}/${candidates.length} candidate details.`);
console.log(`Failures: ${failures.length}`);

async function fetchCandidateDetail(candidate) {
  const url = new URL(DETAIL_URL);
  url.searchParams.set("electionId", ELECTION_ID);
  url.searchParams.set("huboId", candidate.huboid);

  const html = await fetchText(url);

  return {
    huboId: candidate.huboid,
    name: candidate.name,
    assets: moneyFromThousandWon(extractTableValue(html, "재산신고액\\(천원\\)")),
    military: normalizeBlank(extractTableValue(html, "병역신고사항\\(본인\\)")),
    taxPaid: moneyFromThousandWon(extractTableValue(html, "납부액\\(천원\\)")),
    taxArrearsLastFiveYears: moneyFromThousandWon(extractTableValue(html, "최근 5년간 체납액\\(천원\\)")),
    taxArrearsCurrent: moneyFromThousandWon(extractTableValue(html, "현체납액\\(천원\\)")),
    criminalRecordCount: criminalCount(extractTableValue(html, "전과기록유무\\(건수\\)")),
    photoUrl: extractPhotoUrl(html),
    disclosureViewerUrl: url.toString(),
    source: {
      label: SOURCE_LABEL,
      url: url.toString(),
      fetchedAt
    },
    raw: {
      assets: normalizeBlank(extractTableValue(html, "재산신고액\\(천원\\)")),
      military: normalizeBlank(extractTableValue(html, "병역신고사항\\(본인\\)")),
      taxPaid: normalizeBlank(extractTableValue(html, "납부액\\(천원\\)")),
      taxArrearsLastFiveYears: normalizeBlank(extractTableValue(html, "최근 5년간 체납액\\(천원\\)")),
      taxArrearsCurrent: normalizeBlank(extractTableValue(html, "현체납액\\(천원\\)")),
      criminalRecordCount: normalizeBlank(extractTableValue(html, "전과기록유무\\(건수\\)"))
    }
  };
}

async function readPreviousDetails() {
  return readFile(outputUrl, "utf8").then(JSON.parse).catch(() => ({ details: {}, failures: [] }));
}

async function save() {
  await writeFile(
    outputUrl,
    `${JSON.stringify(
      {
        electionId: ELECTION_ID,
        fetchedAt,
        totalCandidates: candidates.length,
        collectedCandidates: Object.keys(details).length,
        source: {
          label: SOURCE_LABEL,
          url: DETAIL_URL
        },
        details,
        failures
      },
      null,
      2
    )}\n`
  );
}

function uniqueCandidates(items) {
  return [...new Map(items.map((candidate) => [candidate.huboid, candidate])).values()]
    .sort((a, b) => a.sdName.localeCompare(b.sdName, "ko") || a.name.localeCompare(b.name, "ko"));
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 BeforeYouVote candidate detail collector"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.text();
}

function extractTableValue(html, escapedLabel) {
  const pattern = new RegExp(`<th[^>]*>\\s*${escapedLabel}\\s*<\\/th>\\s*<td[^>]*>([\\s\\S]*?)<\\/td>`, "i");
  const match = html.match(pattern);

  if (!match?.[1]) {
    return null;
  }

  return decodeHtml(stripTags(match[1])).trim();
}

function extractPhotoUrl(html) {
  const match = html.match(/<img src="([^"]*thumbnail\.[^"]+)"/i);

  if (!match?.[1]) {
    return null;
  }

  return match[1].replace(/^http:\/\//, "https://");
}

function stripTags(value) {
  return value.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function moneyFromThousandWon(value) {
  if (!value) {
    return null;
  }

  const amountThousandKrw = parseInteger(value);

  if (amountThousandKrw === null) {
    return null;
  }

  const amountKrw = amountThousandKrw * 1000;

  return {
    amountKrw,
    display: formatKrw(amountKrw)
  };
}

function criminalCount(value) {
  if (!value) {
    return null;
  }

  return parseInteger(value);
}

function parseInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/[^\d-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeBlank(value) {
  return value && value.length > 0 ? value : null;
}

function formatKrw(amountKrw) {
  if (amountKrw === 0) {
    return "0원";
  }

  const eok = amountKrw / 100_000_000;

  if (Math.abs(eok) >= 1) {
    return `${formatOneDecimal(eok)}억`;
  }

  const man = amountKrw / 10_000;

  if (Math.abs(man) >= 1) {
    return `${Math.round(man).toLocaleString("ko-KR")}만원`;
  }

  return `${amountKrw.toLocaleString("ko-KR")}원`;
}

function formatOneDecimal(value) {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
}
