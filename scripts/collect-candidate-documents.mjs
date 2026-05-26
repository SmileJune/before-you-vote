import { readFile, writeFile } from "node:fs/promises";

const POLICY_BASE_URL = "https://policy.nec.go.kr";
const CDN_BASE_URL = "https://cdn.nec.go.kr/policy_pdf";
const SG_ID = "20260603";
const OUTPUT_URL = new URL("../data/nec/candidate-documents-20260603.json", import.meta.url);
const nationwide = JSON.parse(await readFile(new URL("../data/nec/nationwide-candidates-20260603.json", import.meta.url), "utf8"));

const electionTypes = [
  { subSgId: "220260603", sgTypecode: "2", name: "국회의원선거" },
  { subSgId: "320260603", sgTypecode: "3", name: "시·도지사선거" },
  { subSgId: "420260603", sgTypecode: "4", name: "구·시·군의 장선거" },
  { subSgId: "520260603", sgTypecode: "5", name: "시·도의회의원선거" },
  { subSgId: "620260603", sgTypecode: "6", name: "구·시·군의회의원선거" },
  { subSgId: "820260603", sgTypecode: "8", name: "광역의원비례대표선거" },
  { subSgId: "920260603", sgTypecode: "9", name: "기초의원비례대표선거" },
  { subSgId: "1120260603", sgTypecode: "11", name: "교육감선거" }
];

const previous = await readFile(OUTPUT_URL, "utf8")
  .then(JSON.parse)
  .catch(() => ({ documents: {}, failures: [] }));
const documents = { ...(previous.documents ?? {}) };
const failures = [];
const fetchedAt = new Date().toISOString();
const regionCodes = await fetchRegionCodes();

let requestCount = 0;

for (const electionType of electionTypes) {
  for (const region of regionCodes) {
    let pageIndex = 1;

    while (true) {
      requestCount += 1;
      const params = paramsForList(electionType, region.wiwid, pageIndex);

      try {
        const data = await postJson("/plc/commiment/initUCACommimentList.do", params);
        const list = data.list ?? [];

        for (const row of list) {
          if (!row.huboid) {
            continue;
          }

          documents[row.huboid] = normalizeDocumentRow(row, electionType, region);
        }

        const totalCount = Number(data.totalCnt ?? 0);
        if (pageIndex * 10 >= totalCount || list.length === 0) {
          break;
        }

        pageIndex += 1;
      } catch (error) {
        failures.push({
          subSgId: electionType.subSgId,
          sgTypecode: electionType.sgTypecode,
          regionId: region.wiwid,
          regionName: region.wiwname,
          pageIndex,
          message: error instanceof Error ? error.message : String(error)
        });
        break;
      }
    }
  }
}

const candidateHuboIds = new Set(nationwide.candidates.map((candidate) => candidate.huboid));
const matchedCount = Object.keys(documents).filter((huboId) => candidateHuboIds.has(huboId)).length;
const pamphletCount = Object.values(documents).filter((entry) => entry.pamphletPdf?.status === "available").length;
const pledgeCount = Object.values(documents).filter((entry) => entry.pledgePdf?.status === "available").length;

await writeFile(
  OUTPUT_URL,
  `${JSON.stringify(
    {
      sgId: SG_ID,
      source: {
        label: "중앙선거관리위원회 정책공약마당",
        url: `${POLICY_BASE_URL}/plc/commiment/initUCACommiment.do?menuId=CNDDT25`,
        fetchedAt
      },
      stats: {
        requests: requestCount,
        candidateCount: nationwide.candidates.length,
        documentCandidateCount: Object.keys(documents).length,
        matchedCandidateCount: matchedCount,
        pamphletCount,
        pledgeCount,
        failures: failures.length
      },
      documents,
      failures
    },
    null,
    2
  )}\n`
);

console.log(
  `Collected policy documents for ${Object.keys(documents).length} candidates. ` +
    `Matched ${matchedCount}/${nationwide.candidates.length}. ` +
    `Pamphlets: ${pamphletCount}, pledges: ${pledgeCount}, failures: ${failures.length}.`
);

async function fetchRegionCodes() {
  const data = await postJson("/plc/commiment/initUCACommimentRegion.do", {
    sgId: SG_ID,
    subSgId: "320260603"
  });

  return (data.regionlist ?? []).filter((region) => region.wiwid && region.wiwid !== "ALL");
}

function paramsForList(electionType, regionId, pageIndex) {
  const params = {
    sgId: SG_ID,
    subSgId: electionType.subSgId,
    hRegionId: regionId,
    hGuId: "",
    hSggId: "",
    sgTypecode: electionType.sgTypecode,
    pageIndex: String(pageIndex),
    phGuId: "",
    elecEndYn: "N"
  };

  if (["2", "4", "9"].includes(electionType.sgTypecode)) {
    params.hSggId = "ALL";
  }

  if (["5", "6"].includes(electionType.sgTypecode)) {
    params.hGuId = "ALL";
    params.hSggId = "ALL";
  }

  return params;
}

async function postJson(path, params) {
  const response = await fetch(`${POLICY_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "BeforeYouVote data collector"
    },
    body: new URLSearchParams(params)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

function normalizeDocumentRow(row, electionType, region) {
  const files = parseFileInfo(row.fileinfo);
  const pamphlet = pickDocument(files, ["선거공보", "책자형선거공보", "전단형선거공보"]);
  const pledge = pickDocument(files, ["5대공약", "10대공약", "선거공약서"]);

  return {
    huboId: row.huboid,
    name: row.hbjname,
    partyName: row.jdname,
    electionName: electionType.name,
    districtName: row.sggname,
    regionName: region.wiwname,
    fileDispYn: row.fileDispYn,
    pamphletPdf: toCandidateDocument(pamphlet, "선거공보"),
    pledgePdf: toCandidateDocument(pledge, "5대공약"),
    rawFileInfo: row.fileinfo ?? "",
    source: {
      label: "중앙선거관리위원회 정책공약마당",
      url: `${POLICY_BASE_URL}/plc/commiment/initUCACommiment.do?menuId=CNDDT25`,
      fetchedAt
    }
  };
}

function parseFileInfo(fileinfo) {
  if (!fileinfo) {
    return [];
  }

  return fileinfo
    .split(",")
    .map((item) => {
      const [label, path, promiseId, imageCount, pdfTypeCode, previewYn, resultCode, openStatusCode] = item.split("||");
      return {
        label,
        path,
        promiseId,
        imageCount,
        pdfTypeCode,
        previewYn,
        resultCode,
        openStatusCode
      };
    })
    .filter((file) => file.label);
}

function pickDocument(files, labels) {
  const candidates = labels.flatMap((label) => files.filter((file) => file.label === label));
  return candidates.find((file) => file.path && file.path !== "/") ?? candidates[0] ?? null;
}

function toCandidateDocument(file, fallbackLabel) {
  if (!file) {
    return { label: fallbackLabel, url: "", status: "missing" };
  }

  if (!file.path || file.path === "/") {
    return { label: file.label || fallbackLabel, url: "", status: "missing" };
  }

  if (file.openStatusCode && file.openStatusCode !== "01") {
    return { label: file.label || fallbackLabel, url: `${CDN_BASE_URL}/${file.path}`, status: "pending" };
  }

  return { label: file.label || fallbackLabel, url: `${CDN_BASE_URL}/${file.path}`, status: "available" };
}
