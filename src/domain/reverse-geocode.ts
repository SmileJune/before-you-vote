import { getAdministrativeAreaOptions } from "./district-mapping";
import type { Dataset } from "./types";

export type ReverseGeocodedRegion = {
  sido: string;
  sigungu: string;
  eupmyeondong: string;
  addressName: string;
};

export type ResolvedLocationSelection = {
  regionSlug: string;
  areaId: string;
  displayName: string;
};

const sidoAliases = new Map([
  ["서울", "서울특별시"],
  ["부산", "부산광역시"],
  ["대구", "대구광역시"],
  ["인천", "인천광역시"],
  ["광주", "광주광역시"],
  ["대전", "대전광역시"],
  ["울산", "울산광역시"],
  ["세종", "세종특별자치시"],
  ["경기", "경기도"],
  ["강원", "강원특별자치도"],
  ["충북", "충청북도"],
  ["충남", "충청남도"],
  ["전북", "전북특별자치도"],
  ["전남", "전라남도"],
  ["경북", "경상북도"],
  ["경남", "경상남도"],
  ["제주", "제주특별자치도"]
]);

export function resolveReverseGeocodedRegion(
  dataset: Dataset,
  geocoded: ReverseGeocodedRegion
): ResolvedLocationSelection | null {
  const normalizedSido = normalizeSido(geocoded.sido);
  const normalizedSigungu = normalizeAdministrativeName(geocoded.sigungu);
  const normalizedArea = normalizeAdministrativeName(geocoded.eupmyeondong);

  const areaMatches = dataset.regions
    .filter((region) => normalizeSido(region.sido) === normalizedSido)
    .flatMap((region) =>
      getAdministrativeAreaOptions(region.slug)
        .filter((area) => normalizeAdministrativeName(area.label) === normalizedArea)
        .map((area) => ({
          region,
          area,
          score: scoreSigunguMatch(normalizeAdministrativeName(region.sigungu), normalizedSigungu)
        }))
    )
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score);

  const bestAreaMatch = areaMatches[0];

  if (bestAreaMatch) {
    return {
      regionSlug: bestAreaMatch.region.slug,
      areaId: bestAreaMatch.area.id,
      displayName: `${bestAreaMatch.region.displayName} ${bestAreaMatch.area.label}`
    };
  }

  const regionMatch = dataset.regions
    .filter((region) => normalizeSido(region.sido) === normalizedSido)
    .map((region) => ({
      region,
      score: scoreSigunguMatch(normalizeAdministrativeName(region.sigungu), normalizedSigungu)
    }))
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score)[0];

  if (!regionMatch) {
    return null;
  }

  return {
    regionSlug: regionMatch.region.slug,
    areaId: "",
    displayName: regionMatch.region.displayName
  };
}

function scoreSigunguMatch(regionSigungu: string, geocodedSigungu: string) {
  if (regionSigungu === geocodedSigungu) {
    return 3;
  }

  if (regionSigungu.includes(geocodedSigungu) || geocodedSigungu.includes(regionSigungu)) {
    return 2;
  }

  return 0;
}

function normalizeSido(value: string) {
  const normalized = normalizeAdministrativeName(value);
  return sidoAliases.get(normalized) ?? normalized;
}

function normalizeAdministrativeName(value: string) {
  return value.replace(/\s+/g, "");
}
