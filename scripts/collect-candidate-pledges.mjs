import { readFile, writeFile } from "node:fs/promises";

const POLICY_BASE_URL = "https://policy.nec.go.kr";
const OUTPUT_URL = new URL("../data/nec/candidate-pledges-20260603.json", import.meta.url);
const documents = JSON.parse(await readFile(new URL("../data/nec/candidate-documents-20260603.json", import.meta.url), "utf8"));
const previous = await readFile(OUTPUT_URL, "utf8")
  .then(JSON.parse)
  .catch(() => ({ pledges: {}, failures: [] }));

const pledges = { ...(previous.pledges ?? {}) };
const failures = [];
const fetchedAt = new Date().toISOString();
const candidates = Object.values(documents.documents ?? {})
  .map((entry) => ({ ...entry, pledgeTextId: extractPledgeTextId(entry.rawFileInfo) }))
  .filter((entry) => entry.huboId && entry.pledgeTextId);

for (const [index, candidate] of candidates.entries()) {
  if (process.env.REFRESH_PLEDGES !== "1" && pledges[candidate.huboId]?.pledges?.length > 0) {
    continue;
  }

  try {
    pledges[candidate.huboId] = await fetchCandidatePledges(candidate, fetchedAt);
  } catch (error) {
    failures.push({
      huboId: candidate.huboId,
      name: candidate.name,
      pledgeTextId: candidate.pledgeTextId,
      message: error instanceof Error ? error.message : String(error)
    });
  }

  if ((index + 1) % 50 === 0) {
    await writeOutput();
  }
}

await writeOutput();

const pledgeCandidateCount = Object.values(pledges).filter((entry) => entry.pledges?.length > 0).length;
const pledgeItemCount = Object.values(pledges).reduce((sum, entry) => sum + (entry.pledges?.length ?? 0), 0);

console.log(
  `Collected pledge text for ${pledgeCandidateCount}/${candidates.length} candidates. ` +
    `Items: ${pledgeItemCount}, failures: ${failures.length}.`
);

async function fetchCandidatePledges(candidate, collectedAt) {
  const popupResponse = await fetch(`${POLICY_BASE_URL}/plc/commiment/UELPromisePopup.do`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "BeforeYouVote pledge collector"
    },
    body: new URLSearchParams({
      ocrCnvrSeqNo: candidate.pledgeTextId,
      menuName: "제9회 전국동시지방선거"
    })
  });

  if (!popupResponse.ok) {
    throw new Error(`Popup HTTP ${popupResponse.status}`);
  }

  const popupHtml = await popupResponse.text();
  const cookie = popupResponse.headers.get("set-cookie")?.split(";")[0] ?? "";
  const actionPath = popupHtml.match(/action\s*=\s*"([^"]*UELPromisePopupView\.do[^"]*)"/)?.[1];

  if (!actionPath) {
    throw new Error("Missing popup view action");
  }

  const viewResponse = await fetch(new URL(actionPath, POLICY_BASE_URL), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      "user-agent": "BeforeYouVote pledge collector",
      ...(cookie ? { cookie } : {})
    },
    body: new URLSearchParams({
      ocrCnvrSeqNo: candidate.pledgeTextId,
      menuName: "제9회 전국동시지방선거"
    })
  });

  if (!viewResponse.ok) {
    throw new Error(`View HTTP ${viewResponse.status}`);
  }

  const viewHtml = await viewResponse.text();
  const items = parsePledgeItems(viewHtml);

  if (items.length === 0 || viewHtml.includes("비정상적 접근입니다")) {
    throw new Error("No pledge items in response");
  }

  return {
    huboId: candidate.huboId,
    name: candidate.name,
    partyName: candidate.partyName,
    electionName: candidate.electionName,
    districtName: candidate.districtName,
    pledgeTextId: candidate.pledgeTextId,
    pledges: items,
    source: {
      label: "중앙선거관리위원회 정책공약마당 5대공약 텍스트자료",
      url: `${POLICY_BASE_URL}/plc/commiment/UELPromisePopup.do`,
      fetchedAt: collectedAt
    }
  };
}

function parsePledgeItems(html) {
  const normalized = html.replace(/\r?\n/g, " ");
  const titleMatches = [...normalized.matchAll(/<button[^>]*class="accordion-control[^"]*"[^>]*title="([^"]*)"[^>]*>/g)];
  const contentMatches = [...normalized.matchAll(/<div class="accordion-content-inner">\s*<p>(.*?)<\/p>/g)];

  return titleMatches.map((match, index) => {
    const title = decodeHtml(match[1]);
    const content = decodeHtml(contentMatches[index]?.[1] ?? "");

    return {
      title,
      category: classifyPledge(`${title}\n${content}`),
      content
    };
  });
}

function extractPledgeTextId(fileinfo) {
  if (!fileinfo) {
    return "";
  }

  for (const item of fileinfo.split(",")) {
    const [label, , promiseId] = item.split("||");
    if ((label === "5대공약" || label === "10대공약") && promiseId) {
      return promiseId;
    }
  }

  return "";
}

function classifyPledge(text) {
  const categories = [
    ["교통", ["교통", "철도", "버스", "지하철", "도로", "통근", "GTX", "정류소", "주차"]],
    ["주거/도시", ["주거", "재개발", "재건축", "주택", "도심", "정비", "역세권"]],
    ["교육/돌봄", ["교육", "학교", "돌봄", "보육", "아이", "청소년", "대학", "학습"]],
    ["복지/보건", ["복지", "보건", "의료", "건강", "어르신", "장애", "돌봄", "병원"]],
    ["지역경제/일자리", ["경제", "일자리", "창업", "소상공", "산업", "기업", "청년", "고용"]],
    ["안전/환경", ["안전", "환경", "기후", "탄소", "녹지", "재난", "방범", "하천"]],
    ["행정/재정", ["행정", "재정", "예산", "민원", "공공", "조례", "제도"]]
  ];

  const scored = categories
    .map(([category, keywords]) => ({
      category,
      score: keywords.reduce((sum, keyword) => sum + countOccurrences(text, keyword), 0)
    }))
    .sort((a, b) => b.score - a.score);

  return scored[0]?.score > 0 ? scored[0].category : "기타";
}

function countOccurrences(text, keyword) {
  return text.split(keyword).length - 1;
}

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

async function writeOutput() {
  const pledgeCandidateCount = Object.values(pledges).filter((entry) => entry.pledges?.length > 0).length;
  const pledgeItemCount = Object.values(pledges).reduce((sum, entry) => sum + (entry.pledges?.length ?? 0), 0);

  await writeFile(
    OUTPUT_URL,
    `${JSON.stringify(
      {
        source: {
          label: "중앙선거관리위원회 정책공약마당 5대공약 텍스트자료",
          url: `${POLICY_BASE_URL}/plc/commiment/UELPromisePopup.do`,
          fetchedAt
        },
        stats: {
          targetCandidates: candidates.length,
          pledgeCandidateCount,
          pledgeItemCount,
          failures: failures.length
        },
        pledges,
        failures
      },
      null,
      2
    )}\n`
  );
}
