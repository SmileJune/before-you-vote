import { mkdir, readFile, writeFile } from "node:fs/promises";

const SG_ID = "20260603";
const NUM_OF_ROWS = 1000;
const OUTPUT_DIR = new URL("../data/nec/", import.meta.url);

const sdNames = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도"
];

const electionTypes = [
  { sgTypecode: "2", name: "국회의원선거" },
  { sgTypecode: "3", name: "시·도지사선거" },
  { sgTypecode: "4", name: "구·시·군의 장선거" },
  { sgTypecode: "5", name: "시·도의회의원선거" },
  { sgTypecode: "6", name: "구·시·군의회의원선거" },
  { sgTypecode: "8", name: "광역의원비례대표선거" },
  { sgTypecode: "9", name: "기초의원비례대표선거" },
  { sgTypecode: "11", name: "교육감선거" }
];

const serviceKey = await readServiceKey();
const fetchedAt = new Date().toISOString();
const candidates = [];
const requests = [];

for (const sdName of sdNames) {
  for (const electionType of electionTypes) {
    requests.push({ sdName, ...electionType });
  }
}

for (const [index, request] of requests.entries()) {
  const items = await fetchAllCandidates(request);
  candidates.push(...items.map((item) => normalizeCandidate(item, request)));
  console.log(`${index + 1}/${requests.length} ${request.sdName} ${request.name}: ${items.length}`);
}

const dedupedCandidates = dedupeCandidates(candidates);
const summary = buildSummary(dedupedCandidates);

await mkdir(OUTPUT_DIR, { recursive: true });
await writeFile(
  new URL("nationwide-candidates-20260603.json", OUTPUT_DIR),
  `${JSON.stringify({ sgId: SG_ID, fetchedAt, candidates: dedupedCandidates }, null, 2)}\n`
);
await writeFile(
  new URL("nationwide-summary-20260603.json", OUTPUT_DIR),
  `${JSON.stringify({ sgId: SG_ID, fetchedAt, ...summary }, null, 2)}\n`
);

console.log(`Collected ${dedupedCandidates.length} nationwide candidates.`);
console.log(`Wrote data/nec/nationwide-candidates-20260603.json`);
console.log(`Wrote data/nec/nationwide-summary-20260603.json`);

async function readServiceKey() {
  const env = await readFile(new URL("../.env", import.meta.url), "utf8");
  const match = env.match(/^DATA_OPEN_API_KEY=(.+)$/m);

  if (!match?.[1]) {
    throw new Error("DATA_OPEN_API_KEY is missing in .env");
  }

  return match[1].trim();
}

async function fetchAllCandidates(request) {
  const firstPage = await fetchCandidatePage(request, 1);
  const totalCount = Number(firstPage.totalCount ?? 0);
  const firstItems = toArray(firstPage.items?.item);
  const returnedRows = Number(firstPage.numOfRows ?? firstItems.length ?? NUM_OF_ROWS);
  const pageSize = returnedRows > 0 ? returnedRows : NUM_OF_ROWS;
  const pageCount = Math.ceil(totalCount / pageSize);

  if (pageCount <= 1) {
    return firstItems;
  }

  const rest = [];
  for (let pageNo = 2; pageNo <= pageCount; pageNo += 1) {
    const page = await fetchCandidatePage(request, pageNo);
    rest.push(...toArray(page.items?.item));
  }

  return [...firstItems, ...rest];
}

async function fetchCandidatePage(request, pageNo) {
  const url = new URL("http://apis.data.go.kr/9760000/PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire");
  url.searchParams.set("ServiceKey", serviceKey);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(NUM_OF_ROWS));
  url.searchParams.set("resultType", "json");
  url.searchParams.set("sgId", SG_ID);
  url.searchParams.set("sgTypecode", request.sgTypecode);
  url.searchParams.set("sdName", request.sdName);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${request.sdName} ${request.name}`);
  }

  const json = await response.json();
  const header = json.response?.header;

  if (header?.resultCode === "INFO-03") {
    return { totalCount: 0, items: { item: [] } };
  }

  if (header?.resultCode !== "INFO-00") {
    throw new Error(`Candidate API failed: ${header?.resultCode} ${header?.resultMsg}`);
  }

  return json.response?.body ?? {};
}

function normalizeCandidate(item, request) {
  return {
    sgId: item.sgId,
    sgTypecode: item.sgTypecode,
    electionName: request.name,
    huboid: item.huboid,
    sdName: item.sdName,
    wiwName: item.wiwName,
    sggName: item.sggName,
    giho: item.giho,
    gihoSangse: item.gihoSangse,
    jdName: item.jdName || "무소속",
    name: item.name,
    hanjaName: item.hanjaName,
    gender: item.gender,
    birthday: item.birthday,
    age: item.age,
    addr: item.addr,
    jobId: item.jobId,
    job: item.job,
    eduId: item.eduId,
    edu: item.edu,
    career1: item.career1,
    career2: item.career2,
    status: item.status
  };
}

function toArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function dedupeCandidates(items) {
  const seen = new Map();

  for (const item of items) {
    seen.set(`${item.sgId}:${item.sgTypecode}:${item.huboid}`, item);
  }

  return [...seen.values()].sort(compareCandidates);
}

function compareCandidates(a, b) {
  return (
    a.sgTypecode.localeCompare(b.sgTypecode, "ko") ||
    a.sdName.localeCompare(b.sdName, "ko") ||
    a.sggName.localeCompare(b.sggName, "ko") ||
    a.wiwName.localeCompare(b.wiwName, "ko") ||
    Number(a.giho || Number.MAX_SAFE_INTEGER) - Number(b.giho || Number.MAX_SAFE_INTEGER) ||
    a.name.localeCompare(b.name, "ko")
  );
}

function buildSummary(items) {
  const bySido = {};
  const byElectionType = {};
  const bySidoAndType = {};

  for (const item of items) {
    bySido[item.sdName] = (bySido[item.sdName] ?? 0) + 1;
    byElectionType[item.sgTypecode] = (byElectionType[item.sgTypecode] ?? 0) + 1;

    const sido = (bySidoAndType[item.sdName] ??= {});
    sido[item.sgTypecode] = (sido[item.sgTypecode] ?? 0) + 1;
  }

  return {
    totalCandidates: items.length,
    electionTypes,
    bySido,
    byElectionType,
    bySidoAndType
  };
}
