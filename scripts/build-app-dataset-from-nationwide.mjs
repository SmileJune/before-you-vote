import { readFile, writeFile } from "node:fs/promises";

const nationwide = JSON.parse(await readFile(new URL("../data/nec/nationwide-candidates-20260603.json", import.meta.url), "utf8"));
const nationwideDetails = await readCandidateDetails();
const candidateDocuments = await readCandidateDocuments();
const previousDataset = await readPreviousDataset();
const previousByHuboId = new Map((previousDataset?.candidates ?? []).map((candidate) => [extractHuboId(candidate.id), candidate]));

const electionTypeMeta = {
  "2": { category: "국회의원", ballotName: "국회의원선거", sortOrder: 5 },
  "3": { category: "시·도지사", ballotName: "시·도지사선거", sortOrder: 10 },
  "4": { category: "구·시·군의 장", ballotName: "구·시·군의 장선거", sortOrder: 30 },
  "5": { category: "시·도의회의원", ballotName: "시·도의회의원선거", sortOrder: 40 },
  "6": { category: "구·시·군의회의원", ballotName: "구·시·군의회의원선거", sortOrder: 50 },
  "8": { category: "광역의원비례대표", ballotName: "광역의원비례대표선거", sortOrder: 60 },
  "9": { category: "기초의원비례대표", ballotName: "기초의원비례대표선거", sortOrder: 70 },
  "11": { category: "교육감", ballotName: "교육감선거", sortOrder: 20 }
};

const regionMap = new Map();

for (const rawCandidate of nationwide.candidates) {
  const localName = getRegionLocalName(rawCandidate);
  const key = `${rawCandidate.sdName}|${localName}`;

  if (!regionMap.has(key)) {
    regionMap.set(key, {
      id: slugForRegion(rawCandidate.sdName, localName),
      slug: slugForRegion(rawCandidate.sdName, localName),
      displayName: displayNameForRegion(rawCandidate.sdName, localName),
      sido: rawCandidate.sdName,
      sigungu: localName,
      eupmyeondong: "",
      notice: "전국 후보자 기본정보 기준으로 구성한 지역입니다. 실제 투표 지역은 주민등록상 주소와 투표안내문 기준으로 확인하세요."
    });
  }
}

const regions = [...regionMap.values()].sort((a, b) => a.sido.localeCompare(b.sido, "ko") || a.sigungu.localeCompare(b.sigungu, "ko"));
const regionBySidoAndSigungu = new Map(regions.map((region) => [`${region.sido}|${region.sigungu}`, region]));
const electionsById = new Map();
const candidates = [];

for (const rawCandidate of nationwide.candidates) {
  const candidateRegions = regionsForCandidate(rawCandidate);

  for (const region of candidateRegions) {
    const electionKey = getElectionKey(rawCandidate, region);
    const electionId = slugify(`${region.id}-${electionKey}`);

    if (!electionsById.has(electionId)) {
      electionsById.set(electionId, {
        id: electionId,
        regionIds: [region.id],
        title: titleForElection(rawCandidate),
        category: electionTypeMeta[rawCandidate.sgTypecode]?.category ?? rawCandidate.electionName,
        districtName: rawCandidate.sggName || rawCandidate.wiwName || rawCandidate.sdName,
        ballotName: electionTypeMeta[rawCandidate.sgTypecode]?.ballotName ?? rawCandidate.electionName,
        sortOrder: electionTypeMeta[rawCandidate.sgTypecode]?.sortOrder ?? 999
      });
    }

    candidates.push(toAppCandidate(rawCandidate, electionId));
  }
}

const dataset = {
  regions,
  elections: [...electionsById.values()].sort((a, b) => a.regionIds[0].localeCompare(b.regionIds[0]) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "ko")),
  candidates: dedupeAppCandidates(candidates)
};

await writeFile(new URL("../data/nec/app-election-dataset-20260603.json", import.meta.url), `${JSON.stringify(dataset)}\n`);
await writeFile(
  new URL("../src/domain/generated-election-data.ts", import.meta.url),
  [
    'import { readFileSync } from "node:fs";',
    'import { join } from "node:path";',
    'import type { Dataset } from "./types";',
    "",
    "export const electionDataset = JSON.parse(",
    '  readFileSync(join(process.cwd(), "data/nec/app-election-dataset-20260603.json"), "utf8")',
    ") as Dataset;",
    ""
  ].join("\n")
);

console.log(`Generated ${dataset.regions.length} regions, ${dataset.elections.length} elections, ${dataset.candidates.length} candidate entries.`);

function getRegionLocalName(candidate) {
  if (candidate.sgTypecode === "4") {
    return candidate.sggName || candidate.wiwName || candidate.sdName;
  }

  return candidate.wiwName || candidate.sggName || candidate.sdName;
}

function regionsForCandidate(candidate) {
  const meta = electionTypeMeta[candidate.sgTypecode];

  if (!meta) {
    return [];
  }

  if (["3", "8", "11"].includes(candidate.sgTypecode)) {
    return regions.filter((region) => region.sido === candidate.sdName);
  }

  if (["4", "9"].includes(candidate.sgTypecode) && candidate.sggName) {
    return regions.filter(
      (region) =>
        region.sido === candidate.sdName &&
        (region.sigungu === candidate.sggName || region.sigungu.startsWith(candidate.sggName))
    );
  }

  const localName = getRegionLocalName(candidate);
  const region = regionBySidoAndSigungu.get(`${candidate.sdName}|${localName}`);
  return region ? [region] : [];
}

function getElectionKey(candidate, region) {
  if (["3", "8", "11"].includes(candidate.sgTypecode)) {
    return `${candidate.sgTypecode}|${candidate.sdName}`;
  }

  if (candidate.sgTypecode === "4" || candidate.sgTypecode === "9") {
    return `${candidate.sgTypecode}|${region.sigungu}`;
  }

  return `${candidate.sgTypecode}|${candidate.sggName || region.sigungu}`;
}

function toAppCandidate(candidate, electionId) {
  const detail = nationwideDetails.details?.[candidate.huboid] ?? null;
  const documents = candidateDocuments.documents?.[candidate.huboid] ?? null;
  const previous = previousByHuboId.get(candidate.huboid);
  const career = [candidate.career1, candidate.career2].filter(Boolean).join("\n") || "자료 없음";

  return {
    id: `${electionId}-${candidate.huboid}`,
    electionId,
    name: candidate.name,
    partyName: candidate.jdName || "무소속",
    ballotNumber: parseInteger(candidate.giho),
    sortOrder: parseInteger(candidate.num) ?? undefined,
    job: candidate.job || "자료 없음",
    education: candidate.edu || "자료 없음",
    career,
    assets: detail?.assets ?? previous?.assets ?? null,
    military: detail?.military ?? previous?.military ?? null,
    taxPaid: detail?.taxPaid ?? previous?.taxPaid ?? null,
    taxArrearsLastFiveYears: detail?.taxArrearsLastFiveYears ?? previous?.taxArrearsLastFiveYears ?? null,
    taxArrearsCurrent: detail?.taxArrearsCurrent ?? previous?.taxArrearsCurrent ?? null,
    criminalRecordCount: detail?.criminalRecordCount ?? previous?.criminalRecordCount ?? null,
    photoUrl: detail?.photoUrl ?? previous?.photoUrl ?? null,
    pamphletPdf: normalizeDocument(documents?.pamphletPdf) ?? previous?.pamphletPdf ?? null,
    pledgePdf: normalizeDocument(documents?.pledgePdf) ?? previous?.pledgePdf ?? null,
    disclosureViewerUrl: detail?.disclosureViewerUrl ?? previous?.disclosureViewerUrl ?? `https://info.nec.go.kr/electioninfo/candidate_detail_info.xhtml?electionId=0020260603&huboId=${candidate.huboid}`,
    source: detail?.source ?? previous?.source ?? {
      label: "중앙선거관리위원회 후보자 OpenAPI",
      url: "http://apis.data.go.kr/9760000/PofelcddInfoInqireService/getPofelcddRegistSttusInfoInqire",
      fetchedAt: nationwide.fetchedAt
    }
  };
}

function titleForElection(candidate) {
  switch (candidate.sgTypecode) {
    case "2":
      return `${candidate.sggName} 국회의원`;
    case "3":
      return titleForGovernor(candidate.sdName);
    case "4":
      return titleForLocalChief(candidate.sggName);
    case "5":
      return `${candidate.sggName} 시·도의원`;
    case "6":
      return `${candidate.sggName} 구·시·군의원`;
    case "8":
      return `${candidate.sdName} 광역의원 비례대표`;
    case "9":
      return `${candidate.sggName || candidate.wiwName} 기초의원 비례대표`;
    case "11":
      return `${candidate.sdName}교육감`;
    default:
      return candidate.electionName;
  }
}

function titleForGovernor(sdName) {
  if (sdName.endsWith("도")) {
    return `${sdName}지사`;
  }

  if (sdName.endsWith("시")) {
    return `${sdName}장`;
  }

  return `${sdName} 단체장`;
}

function titleForLocalChief(name) {
  if (!name) {
    return "구·시·군의 장";
  }

  if (name.endsWith("시")) {
    return `${name}장`;
  }

  if (name.endsWith("군")) {
    return `${name}수`;
  }

  if (name.endsWith("구")) {
    return `${name}청장`;
  }

  return `${name} 장`;
}

function displayNameForRegion(sido, sigungu) {
  if (sido === sigungu) {
    return sido;
  }

  return `${sido} ${sigungu}`;
}

function slugForRegion(sido, sigungu) {
  if (sido === "서울특별시" && sigungu === "마포구") {
    return "seoul-mapo-seogyo";
  }

  if (sido === "경기도" && sigungu === "화성시동탄구") {
    return "gyeonggi-hwaseong-dongtan";
  }

  return `region-${hash(`${sido}|${sigungu}`)}`;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function hash(value) {
  let hashValue = 0;

  for (let index = 0; index < value.length; index += 1) {
    hashValue = (hashValue * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hashValue.toString(36);
}

function parseInteger(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(String(value).replace(/[^\d-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function dedupeAppCandidates(items) {
  const seen = new Map();

  for (const item of items) {
    seen.set(`${item.electionId}:${item.id}`, item);
  }

  return [...seen.values()];
}

async function readPreviousDataset() {
  const jsonDataset = await readFile(new URL("../data/nec/app-election-dataset-20260603.json", import.meta.url), "utf8")
    .then(JSON.parse)
    .catch(() => null);

  if (jsonDataset) {
    return jsonDataset;
  }

  return import("../src/domain/generated-election-data.ts").then((module) => module.electionDataset).catch(() => null);
}

async function readCandidateDetails() {
  return readFile(new URL("../data/nec/nationwide-candidate-details-20260603.json", import.meta.url), "utf8")
    .then(JSON.parse)
    .catch(() => ({ details: {} }));
}

async function readCandidateDocuments() {
  return readFile(new URL("../data/nec/candidate-documents-20260603.json", import.meta.url), "utf8")
    .then(JSON.parse)
    .catch(() => ({ documents: {} }));
}

function normalizeDocument(document) {
  if (!document || document.status === "missing") {
    return null;
  }

  return document;
}

function extractHuboId(candidateId) {
  return String(candidateId).split("-").at(-1);
}
