import { readFile, writeFile } from "node:fs/promises";

const SG_ID = "20260603";
const ELECTION_ID = "0020260603";
const fetchedAt = new Date().toISOString();

const supportedRegions = [
  {
    id: "seoul-mapo-seogyo",
    slug: "seoul-mapo-seogyo",
    displayName: "서울특별시 마포구 서교동",
    sido: "서울특별시",
    sigungu: "마포구",
    eupmyeondong: "서교동",
    notice: "실제 투표 지역은 주민등록상 주소 기준입니다."
  },
  {
    id: "gyeonggi-hwaseong-dongtan",
    slug: "gyeonggi-hwaseong-dongtan",
    displayName: "경기도 화성시 동탄동",
    sido: "경기도",
    sigungu: "화성시",
    eupmyeondong: "동탄동",
    notice: "좌표 범위로 추정한 지역입니다. 실제 투표 지역은 주민등록상 주소와 투표안내문을 기준으로 확인하세요."
  }
];

const electionConfigs = [
  {
    id: "seoul-mayor",
    regionIds: ["seoul-mapo-seogyo"],
    title: "서울특별시장",
    category: "시·도지사",
    districtName: "서울특별시",
    ballotName: "시·도지사선거",
    sortOrder: 10,
    request: { sgTypecode: "3", sdName: "서울특별시" }
  },
  {
    id: "seoul-education-superintendent",
    regionIds: ["seoul-mapo-seogyo"],
    title: "서울특별시교육감",
    category: "교육감",
    districtName: "서울특별시",
    ballotName: "교육감선거",
    sortOrder: 20,
    request: { sgTypecode: "11", sdName: "서울특별시" }
  },
  {
    id: "mapo-mayor",
    regionIds: ["seoul-mapo-seogyo"],
    title: "마포구청장",
    category: "구·시·군의 장",
    districtName: "마포구",
    ballotName: "구·시·군의 장선거",
    sortOrder: 30,
    request: { sgTypecode: "4", sdName: "서울특별시", sggName: "마포구" }
  },
  {
    id: "gyeonggi-governor",
    regionIds: ["gyeonggi-hwaseong-dongtan"],
    title: "경기도지사",
    category: "시·도지사",
    districtName: "경기도",
    ballotName: "시·도지사선거",
    sortOrder: 10,
    request: { sgTypecode: "3", sdName: "경기도" }
  },
  {
    id: "gyeonggi-education-superintendent",
    regionIds: ["gyeonggi-hwaseong-dongtan"],
    title: "경기도교육감",
    category: "교육감",
    districtName: "경기도",
    ballotName: "교육감선거",
    sortOrder: 20,
    request: { sgTypecode: "11", sdName: "경기도" }
  },
  {
    id: "hwaseong-mayor",
    regionIds: ["gyeonggi-hwaseong-dongtan"],
    title: "화성시장",
    category: "구·시·군의 장",
    districtName: "화성시",
    ballotName: "구·시·군의 장선거",
    sortOrder: 30,
    request: { sgTypecode: "4", sdName: "경기도", sggName: "화성시" }
  }
];

const serviceKey = await readServiceKey();
const candidates = [];

for (const election of electionConfigs) {
  const openApiCandidates = await fetchCandidates(election.request);

  for (const [index, item] of openApiCandidates.entries()) {
    const detail = await fetchCandidateDetail(item.huboid);
    candidates.push(toCandidate(election.id, item, detail, index + 1));
  }
}

const dataset = {
  regions: supportedRegions,
  elections: electionConfigs.map(({ request: _request, ...election }) => election),
  candidates
};

await writeFile(
  new URL("../src/domain/generated-election-data.ts", import.meta.url),
  `import type { Dataset } from "./types";\n\nexport const electionDataset = ${JSON.stringify(dataset, null, 2)} satisfies Dataset;\n`
);

console.log(`Collected ${candidates.length} candidates into src/domain/generated-election-data.ts`);

async function readServiceKey() {
  const env = await readFile(new URL("../.env", import.meta.url), "utf8");
  const match = env.match(/^DATA_OPEN_API_KEY=(.+)$/m);

  if (!match?.[1]) {
    throw new Error("DATA_OPEN_API_KEY is missing in .env");
  }

  return match[1].trim();
}

async function fetchCandidates(request) {
  const url = new URL("http://apis.data.go.kr/9760000/PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire");
  url.searchParams.set("ServiceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "100");
  url.searchParams.set("resultType", "json");
  url.searchParams.set("sgId", SG_ID);
  url.searchParams.set("sgTypecode", request.sgTypecode);
  url.searchParams.set("sdName", request.sdName);

  if (request.sggName) {
    url.searchParams.set("sggName", request.sggName);
  }

  const json = await fetchJson(url);
  const header = json.response?.header;

  if (header?.resultCode !== "INFO-00") {
    throw new Error(`Candidate API failed: ${header?.resultCode} ${header?.resultMsg}`);
  }

  const item = json.response?.body?.items?.item ?? [];
  return Array.isArray(item) ? item : [item];
}

async function fetchCandidateDetail(huboId) {
  const url = new URL("https://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml");
  url.searchParams.set("electionId", ELECTION_ID);
  url.searchParams.set("huboId", huboId);

  const html = await fetchText(url);

  return {
    url: url.toString(),
    assets: moneyFromThousandWon(extractTableValue(html, "재산신고액\\(천원\\)")),
    military: normalizeBlank(extractTableValue(html, "병역신고사항\\(본인\\)")),
    taxPaid: moneyFromThousandWon(extractTableValue(html, "납부액\\(천원\\)")),
    taxArrearsLastFiveYears: moneyFromThousandWon(extractTableValue(html, "최근 5년간 체납액\\(천원\\)")),
    taxArrearsCurrent: moneyFromThousandWon(extractTableValue(html, "현체납액\\(천원\\)")),
    criminalRecordCount: criminalCount(extractTableValue(html, "전과기록유무\\(건수\\)")),
    photoUrl: extractPhotoUrl(html)
  };
}

async function fetchJson(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response.text();
}

function toCandidate(electionId, item, detail, sortOrder) {
  const ballotNumber = parseInteger(item.giho);
  const career = [item.career1, item.career2].filter(Boolean).join("\n");

  return {
    id: item.huboid,
    electionId,
    name: item.name,
    partyName: item.jdName || "무소속",
    ballotNumber,
    sortOrder,
    job: item.job || "자료 없음",
    education: item.edu || "자료 없음",
    career: career || "자료 없음",
    assets: detail.assets,
    military: detail.military,
    taxPaid: detail.taxPaid,
    taxArrearsLastFiveYears: detail.taxArrearsLastFiveYears,
    taxArrearsCurrent: detail.taxArrearsCurrent,
    criminalRecordCount: detail.criminalRecordCount,
    photoUrl: detail.photoUrl,
    pamphletPdf: null,
    pledgePdf: null,
    disclosureViewerUrl: detail.url,
    source: {
      label: "중앙선거관리위원회 선거통계시스템",
      url: detail.url,
      fetchedAt
    }
  };
}

function extractTableValue(html, escapedLabel) {
  const pattern = new RegExp(`<th>\\s*${escapedLabel}\\s*<\\/th>\\s*<td>([\\s\\S]*?)<\\/td>`, "i");
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
