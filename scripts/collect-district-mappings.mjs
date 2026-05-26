import { readFile, writeFile } from "node:fs/promises";

const siteMeta = [
  { code: "su", sido: "서울특별시" },
  { code: "bs", sido: "부산광역시" },
  { code: "dg", sido: "대구광역시" },
  { code: "ic", sido: "인천광역시" },
  { code: "gj", sido: "광주광역시" },
  { code: "dj", sido: "대전광역시" },
  { code: "us", sido: "울산광역시" },
  { code: "sj", sido: "세종특별자치시" },
  { code: "gg", sido: "경기도" },
  { code: "gw", sido: "강원특별자치도" },
  { code: "cb", sido: "충청북도" },
  { code: "cn", sido: "충청남도" },
  { code: "jb", sido: "전북특별자치도" },
  { code: "jn", sido: "전라남도" },
  { code: "gb", sido: "경상북도" },
  { code: "gn", sido: "경상남도" },
  { code: "jj", sido: "제주특별자치도" }
];

const appDataset = JSON.parse(await readFile(new URL("../data/nec/app-election-dataset-20260603.json", import.meta.url), "utf8"));
const regionsBySidoAndSigungu = new Map(appDataset.regions.map((region) => [`${region.sido}|${region.sigungu}`, region]));
const electionsByRegionId = new Map();

for (const election of appDataset.elections) {
  for (const regionId of election.regionIds) {
    electionsByRegionId.set(regionId, [...(electionsByRegionId.get(regionId) ?? []), election]);
  }
}

const fetchedAt = new Date().toISOString();
const mappingsByRegion = new Map();
const failures = [];

for (const site of siteMeta) {
  try {
    const guSiGunListUrl = await findGuSiGunListUrl(site.code);
    const listHtml = await fetchText(guSiGunListUrl);
    const committees = discoverCommittees(listHtml, site);

    for (const committee of committees) {
      try {
        const statusUrl = await findStatusUrl(committee.url);
        const statusHtml = await fetchText(statusUrl);
        const parsed = parseStatusPage(statusHtml, site.sido, committee.name, statusUrl);

        if (parsed) {
          const regionMapping = toRegionMapping(parsed);

          if (regionMapping) {
            mappingsByRegion.set(regionMapping.regionSlug, regionMapping);
          }
        }
      } catch (error) {
        failures.push({ site: site.code, committee: committee.name, url: committee.url, reason: error.message });
      }
    }
  } catch (error) {
    failures.push({ site: site.code, reason: error.message });
  }
}

const output = {
  fetchedAt,
  source: "시·도선거관리위원회 구·시·군위원회 선거관리현황",
  regions: Object.fromEntries([...mappingsByRegion.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
  failures
};

await writeFile(new URL("../data/nec/district-mappings-20260603.json", import.meta.url), `${JSON.stringify(output)}\n`);
await writeFile(
  new URL("../src/domain/generated-district-mappings.ts", import.meta.url),
  [
    'import districtMappingDatasetJson from "../../data/nec/district-mappings-20260603.json";',
    'import type { DistrictMappingDataset } from "./district-mapping";',
    "",
    "export const districtMappingDataset = districtMappingDatasetJson as DistrictMappingDataset;",
    ""
  ].join("\n")
);

console.log(`Collected district mappings for ${mappingsByRegion.size} regions.`);
console.log(`Failures: ${failures.length}`);

async function findGuSiGunListUrl(siteCode) {
  const mainUrl = `https://${siteCode}.nec.go.kr/${siteCode}/main/main.do`;
  const html = await fetchText(mainUrl);
  const match = html.match(new RegExp(`href="([^"]*\\/${siteCode}\\/singl\\/deptInfo\\/guSiGunInfo\\.do\\?menuNo=\\d+)"`));

  if (!match) {
    throw new Error("Cannot find guSiGunInfo link");
  }

  return absoluteUrl(match[1], siteCode);
}

function discoverCommittees(html, site) {
  const committees = new Map();
  const quickLinkPattern = /moveQuickGuSiGunPage\('([^']+)'\)">([^<]+선거관리위원회)/g;
  const directLinkPattern = /href="([^"]+)"[^>]*title="([^"]+선거관리위원회)[^"]*"[^>]*>\s*이동\s*<\/a>/g;

  for (const match of html.matchAll(quickLinkPattern)) {
    committees.set(match[2].trim(), {
      name: cleanCommitteeName(match[2]),
      url: absoluteUrl(match[1], site.code)
    });
  }

  for (const match of html.matchAll(directLinkPattern)) {
    committees.set(match[2].trim(), {
      name: cleanCommitteeName(match[2]),
      url: absoluteUrl(match[1], site.code)
    });
  }

  return [...committees.values()];
}

async function findStatusUrl(committeeUrl) {
  const html = await fetchText(committeeUrl);
  const match = html.match(/href="([^"]*\/bbs\/B0000289\/view\.do\?menuNo=\d+)"/);

  if (!match) {
    throw new Error("Cannot find election status link");
  }

  return absoluteUrlFromUrl(match[1], committeeUrl);
}

function parseStatusPage(html, sido, committeeName, sourceUrl) {
  const region = resolveRegion(sido, committeeName);

  if (!region) {
    return null;
  }

  const elections = electionsByRegionId.get(region.id) ?? [];
  const rows = [];

  for (const section of parseDistrictSections(html)) {
    for (const row of section.rows) {
      const districtName = resolveDistrictName(elections, section.category, row.name, region.sigungu);

      if (districtName) {
        rows.push({
          category: section.category,
          districtName,
          areas: row.areas
        });
      }
    }
  }

  if (rows.length === 0) {
    return null;
  }

  return {
    region,
    rows,
    sourceLabel: `${sido}선거관리위원회 ${committeeName} 선거관리현황`,
    sourceUrl
  };
}

function toRegionMapping(parsed) {
  const areas = new Map();

  for (const row of parsed.rows) {
    for (const areaName of row.areas) {
      const current = areas.get(areaName) ?? {
        id: `${parsed.region.slug}-${slugify(areaName)}`,
        label: areaName,
        sourceLabel: parsed.sourceLabel,
        sourceUrl: parsed.sourceUrl,
        districtNames: []
      };

      if (!current.districtNames.includes(row.districtName)) {
        current.districtNames.push(row.districtName);
      }

      areas.set(areaName, current);
    }
  }

  const completeAreas = [...areas.values()]
    .map((area) => ({
      ...area,
      districtNames: area.districtNames.sort((a, b) => sortDistrictName(a) - sortDistrictName(b) || a.localeCompare(b, "ko"))
    }))
    .filter((area) => area.districtNames.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));

  if (completeAreas.length === 0) {
    return null;
  }

  return {
    regionSlug: parsed.region.slug,
    sourceLabel: parsed.sourceLabel,
    sourceUrl: parsed.sourceUrl,
    areas: completeAreas
  };
}

function resolveRegion(sido, committeeName) {
  const sigungu = committeeName.replace(/선거관리위원회$/, "");
  const direct = regionsBySidoAndSigungu.get(`${sido}|${sigungu}`);

  if (direct) {
    return direct;
  }

  return appDataset.regions.find(
    (region) =>
      region.sido === sido &&
      (region.sigungu === sigungu || region.sigungu.startsWith(sigungu) || sigungu.startsWith(region.sigungu))
  );
}

function parseDistrictSections(html) {
  const sections = [];
  const sectionPattern = /<h6>([\s\S]*?선거구[\s\S]*?)<\/h6>[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/gi;

  for (const match of html.matchAll(sectionPattern)) {
    const heading = stripTags(match[1]);
    const category = categoryForHeading(heading);

    if (!category) {
      continue;
    }

    const rows = [];

    for (const rowMatch of match[2].matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => stripTags(cell[1]));

      if (cells.length >= 3 && cells[0].includes("선거구")) {
        rows.push({
          name: cells[0],
          areas: splitAreas(cells[2])
        });
      }
    }

    sections.push({ category, rows });
  }

  return sections;
}

function categoryForHeading(heading) {
  if (/(구·시·군의원|구·시·군의회의원|구의원|군의원)/.test(heading)) {
    return "구·시·군의회의원";
  }

  if (/(시의원|도의원|시·도의원|시·도의회의원|경기도의회의원)/.test(heading)) {
    return "시·도의회의원";
  }

  return null;
}

function resolveDistrictName(elections, category, rawName, sigungu) {
  const candidates = [
    rawName,
    rawName.replace(/\s+/g, ""),
    `${sigungu}${rawName}`,
    `${sigungu}${rawName}`.replace(/\s+/g, ""),
    `${parentCityName(sigungu)}${rawName}`,
    `${parentCityName(sigungu)}${rawName}`.replace(/\s+/g, "")
  ].map(normalizeDistrictName);

  const election = elections.find(
    (item) => item.category === category && candidates.includes(normalizeDistrictName(item.districtName))
  );

  return election?.districtName ?? null;
}

function parentCityName(sigungu) {
  const cityMatch = sigungu.match(/^(.+?시).+구$/);
  return cityMatch ? cityMatch[1] : sigungu;
}

function splitAreas(value) {
  return value
    .replace(/\s*\([^)]*\)\s*/g, "")
    .split(/[,，ㆍ·]/)
    .map((item) => item.trim())
    .filter((item) => item && !/^\d+$/.test(item));
}

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, ", ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#40;/g, "(")
    .replace(/&#41;/g, ")")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeDistrictName(value) {
  return value.replace(/\s+/g, "").replace(/^제/, "").trim();
}

function cleanCommitteeName(value) {
  return value.trim().replace(/선거관리위원회선거관리위원회$/, "선거관리위원회");
}

function absoluteUrl(value, siteCode) {
  if (value.startsWith("http")) {
    return value;
  }

  return `https://${siteCode}.nec.go.kr${value.startsWith("/") ? value : `/${value}`}`;
}

function absoluteUrlFromUrl(value, baseUrl) {
  if (value.startsWith("http")) {
    return value;
  }

  const url = new URL(baseUrl);
  return `${url.origin}${value.startsWith("/") ? value : `/${value}`}`;
}

function sortDistrictName(value) {
  if (value.includes("시·도") || /제\d+선거구/.test(value)) {
    return 0;
  }

  return 1;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 BeforeYouVote district mapping collector"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${url}`);
  }

  return response.text();
}
