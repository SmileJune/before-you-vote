import type { Region } from "./types";

export function getSubregionOptions(regions: Region[], region: Region) {
  return regions
    .filter((item) => isDirectSubregion(regions, region, item))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "ko"));
}

function isDirectSubregion(regions: Region[], region: Region, candidate: Region) {
  if (candidate.slug === region.slug || candidate.sido !== region.sido) {
    return false;
  }

  if (!isSubregion(region, candidate)) {
    return false;
  }

  return !regions.some(
    (item) =>
      item.slug !== region.slug &&
      item.slug !== candidate.slug &&
      item.sido === region.sido &&
      isSubregion(region, item) &&
      isSubregion(item, candidate)
  );
}

function isSubregion(region: Region, candidate: Region) {
  if (isSidoLevelRegion(region)) {
    return candidate.sigungu !== region.sigungu;
  }

  return candidate.sigungu.startsWith(region.sigungu) && candidate.sigungu.length > region.sigungu.length;
}

function isSidoLevelRegion(region: Region) {
  return region.sigungu === region.sido;
}
