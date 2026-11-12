export interface GeoPoint {
  lat: number;
  lon: number;
  label?: string;
}

export interface DeltaCoords {
  deltaLatDeg: number;
  deltaLonDeg: number;
  latDirection: 'North' | 'South' | 'None';
  lonDirection: 'East' | 'West' | 'None';
  dmsDeltaLat: string;
  dmsDeltaLon: string;
  distLatKm: number; // North-South distance component
  distLonKm: number; // East-West distance component at mean latitude
  manhattanDistKm: number; // Lat distance + Lon distance
}

export interface BearingInfo {
  initialBearingDeg: number;
  finalBearingDeg: number;
  reverseBearingDeg: number;
  cardinalInitial: string;
  cardinalReverse: string;
}

export interface DistanceUnits {
  km: number;
  meters: number;
  miles: number;
  feet: number;
  nauticalMiles: number;
  yards: number;
}

export interface TravelTimes {
  walkingHours: number; // 5 km/h
  cyclingHours: number; // 20 km/h
  drivingHours: number; // 85 km/h
  highSpeedRailHours: number; // 250 km/h
  flightHours: number; // 850 km/h
  lightLatencyMs: number; // Speed of light in vacuum ~300,000 km/s (one-way)
}

export interface GeodesicResult {
  haversine: DistanceUnits;
  vincenty: DistanceUnits | null;
  lawOfCosines: DistanceUnits;
  flatEarth: DistanceUnits;
  tunnelChordDistKm: number; // straight chord line through earth's sphere
  delta: DeltaCoords;
  bearing: BearingInfo;
  midpoint: GeoPoint;
  antipodeA: GeoPoint;
  antipodeB: GeoPoint;
  travelTimes: TravelTimes;
}

export interface GeofenceResult {
  radiusMeters: number;
  isInside: boolean;
  distanceToCenterMeters: number;
  marginMeters: number; // if inside: distance to edge remaining; if outside: distance beyond boundary
}

export interface BatchPairItem {
  id: string;
  pointA: GeoPoint;
  pointB: GeoPoint;
  label?: string;
  distanceKm: number;
  distanceMiles: number;
  initialBearing: number;
  cardinal: string;
}
