type Coordinates = {
  latitude: number;
  longitude: number;
};

type MappedRegion = {
  status: "mapped";
  regionSlug: string;
  areaId?: string;
  displayName: string;
};

type UnsupportedRegion = {
  status: "unsupported";
};

type RegionMapping = {
  regionSlug: string;
  areaId?: string;
  displayName: string;
  bounds: {
    minLatitude: number;
    maxLatitude: number;
    minLongitude: number;
    maxLongitude: number;
  };
};

const supportedRegionMappings: RegionMapping[] = [
  {
    regionSlug: "gyeonggi-hwaseong-dongtan",
    displayName: "경기도 화성시 동탄동",
    bounds: {
      minLatitude: 37.16,
      maxLatitude: 37.24,
      minLongitude: 127.04,
      maxLongitude: 127.14
    }
  },
  {
    regionSlug: "seoul-mapo-seogyo",
    areaId: "seoul-mapo-seogyo-서교동",
    displayName: "서울특별시 마포구 서교동",
    bounds: {
      minLatitude: 37.548,
      maxLatitude: 37.562,
      minLongitude: 126.912,
      maxLongitude: 126.934
    }
  }
];

export function mapCoordinatesToRegion(coordinates: Coordinates): MappedRegion | UnsupportedRegion {
  const matched = supportedRegionMappings.find((mapping) => isWithinBounds(coordinates, mapping));

  if (!matched) {
    return { status: "unsupported" };
  }

  return {
    status: "mapped",
    regionSlug: matched.regionSlug,
    areaId: matched.areaId,
    displayName: matched.displayName
  };
}

function isWithinBounds(coordinates: Coordinates, mapping: RegionMapping) {
  return (
    coordinates.latitude >= mapping.bounds.minLatitude &&
    coordinates.latitude <= mapping.bounds.maxLatitude &&
    coordinates.longitude >= mapping.bounds.minLongitude &&
    coordinates.longitude <= mapping.bounds.maxLongitude
  );
}
