import type { Region } from "./types";

export function getSidoRegionOptions(regions: Region[]) {
  return regions
    .filter((item) => isSidoLevelRegion(item))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "ko"));
}

export function getSubregionOptions(regions: Region[], region: Region) {
  return regions
    .filter((item) => isDirectSubregion(regions, region, item))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, "ko"));
}

export function getRegionSelectionPath(regions: Region[], region: Region) {
  const topLevelRegion = regions.find((item) => item.sido === region.sido && isSidoLevelRegion(item));

  if (!topLevelRegion || topLevelRegion.slug === region.slug) {
    return [region];
  }

  const path = [topLevelRegion];
  const visitedRegionSlugs = new Set([topLevelRegion.slug]);
  let currentRegion = topLevelRegion;

  while (currentRegion.slug !== region.slug) {
    const nextRegion = getSubregionOptions(regions, currentRegion).find(
      (candidate) => candidate.slug === region.slug || isSubregion(candidate, region)
    );

    if (!nextRegion || visitedRegionSlugs.has(nextRegion.slug)) {
      break;
    }

    path.push(nextRegion);
    visitedRegionSlugs.add(nextRegion.slug);
    currentRegion = nextRegion;
  }

  if (path[path.length - 1]?.slug !== region.slug) {
    path.push(region);
  }

  return path;
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
