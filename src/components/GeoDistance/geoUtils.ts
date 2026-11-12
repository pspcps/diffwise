import type {
  GeoPoint,
  GeodesicResult,
  DistanceUnits,
  DeltaCoords,
  BearingInfo,
  TravelTimes,
  GeofenceResult,
} from './types';

// Earth constants
export const EARTH_RADIUS_KM = 6371.0088; // IUGG mean Earth radius
export const EARTH_RADIUS_M = 6371008.8;
export const WGS84_A = 6378137.0; // Equatorial semi-major axis (meters)
export const WGS84_B = 6356752.314245; // Polar semi-minor axis (meters)
export const WGS84_F = 1 / 298.257223563; // Flattening

// Conversion helpers
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function normalizeLon(lon: number): number {
  let l = lon % 360;
  if (l > 180) l -= 360;
  if (l < -180) l += 360;
  return l;
}

export function clampLat(lat: number): number {
  return Math.max(-90, Math.min(90, lat));
}

// Convert distance in km to all unit variations
export function toDistanceUnits(km: number): DistanceUnits {
  const meters = km * 1000;
  return {
    km,
    meters,
    miles: km * 0.62137119,
    feet: meters * 3.2808399,
    nauticalMiles: km * 0.5399568,
    yards: meters * 1.0936133,
  };
}

// 1. Haversine Formula (Great-Circle on Sphere)
export function calculateHaversineKm(p1: GeoPoint, p2: GeoPoint): number {
  const phi1 = toRad(p1.lat);
  const phi2 = toRad(p2.lat);
  const deltaPhi = toRad(p2.lat - p1.lat);
  const deltaLambda = toRad(normalizeLon(p2.lon - p1.lon));

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const clampedA = Math.min(1, Math.max(0, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_KM * c;
}

// 2. Spherical Law of Cosines
export function calculateLawOfCosinesKm(p1: GeoPoint, p2: GeoPoint): number {
  const phi1 = toRad(p1.lat);
  const phi2 = toRad(p2.lat);
  const deltaLambda = toRad(normalizeLon(p2.lon - p1.lon));

  const cosC = Math.sin(phi1) * Math.sin(phi2) + Math.cos(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const clampedCosC = Math.min(1, Math.max(-1, cosC));
  const c = Math.acos(clampedCosC);

  return EARTH_RADIUS_KM * c;
}

// 3. Flat-Earth Equirectangular Approximation
export function calculateFlatEarthKm(p1: GeoPoint, p2: GeoPoint): number {
  const phi1 = toRad(p1.lat);
  const phi2 = toRad(p2.lat);
  const lambda1 = toRad(p1.lon);
  const lambda2 = toRad(p2.lon);

  const meanPhi = (phi1 + phi2) / 2;
  const x = (lambda2 - lambda1) * Math.cos(meanPhi);
  const y = phi2 - phi1;

  return EARTH_RADIUS_KM * Math.sqrt(x * x + y * y);
}

// 4. Vincenty Inverse Formula (WGS-84 High-Precision Ellipsoid)
export function calculateVincentyKm(p1: GeoPoint, p2: GeoPoint): number | null {
  const lat1 = p1.lat;
  const lon1 = p1.lon;
  const lat2 = p2.lat;
  const lon2 = p2.lon;

  // Handle coincident points
  if (Math.abs(lat1 - lat2) < 1e-11 && Math.abs(lon1 - lon2) < 1e-11) {
    return 0;
  }

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const L = toRad(normalizeLon(lon2 - lon1));

  const U1 = Math.atan((1 - WGS84_F) * Math.tan(phi1));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(phi2));
  const sinU1 = Math.sin(U1);
  const cosU1 = Math.cos(U1);
  const sinU2 = Math.sin(U2);
  const cosU2 = Math.cos(U2);

  let lambda = L;
  let lambdaP = 2 * Math.PI;
  let iterLimit = 100;
  let cosSqAlpha = 0;
  let sinSigma = 0;
  let cos2SigmaM = 0;
  let cosSigma = 0;
  let sigma = 0;

  while (Math.abs(lambda - lambdaP) > 1e-12 && --iterLimit > 0) {
    const sinLambda = Math.sin(lambda);
    const cosLambda = Math.cos(lambda);

    sinSigma = Math.sqrt(
      cosU2 * sinLambda * (cosU2 * sinLambda) +
        (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda) * (cosU1 * sinU2 - sinU1 * cosU2 * cosLambda)
    );

    if (sinSigma === 0) return 0; // Coincident points

    cosSigma = sinU1 * sinU2 + cosU1 * cosU2 * cosLambda;
    sigma = Math.atan2(sinSigma, cosSigma);

    const sinAlpha = (cosU1 * cosU2 * sinLambda) / sinSigma;
    cosSqAlpha = 1 - sinAlpha * sinAlpha;

    cos2SigmaM = cosSqAlpha !== 0 ? cosSigma - (2 * sinU1 * sinU2) / cosSqAlpha : 0; // Equatorial line

    const C = (WGS84_F / 16) * cosSqAlpha * (4 + WGS84_F * (4 - 3 * cosSqAlpha));
    lambdaP = lambda;
    lambda =
      L +
      (1 - C) *
        WGS84_F *
        sinAlpha *
        (sigma + C * sinSigma * (cos2SigmaM + C * cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM)));
  }

  // Formula failed to converge (e.g. nearly antipodal points)
  if (iterLimit === 0) {
    return null;
  }

  const uSq = (cosSqAlpha * (WGS84_A * WGS84_A - WGS84_B * WGS84_B)) / (WGS84_B * WGS84_B);
  const A = 1 + (uSq / 16384) * (4096 + uSq * (-768 + uSq * (320 - 175 * uSq)));
  const B = (uSq / 1024) * (256 + uSq * (-128 + uSq * (74 - 47 * uSq)));
  const deltaSigma =
    B *
    sinSigma *
    (cos2SigmaM +
      (B / 4) *
        (cosSigma * (-1 + 2 * cos2SigmaM * cos2SigmaM) -
          (B / 6) *
            cos2SigmaM *
            (-3 + 4 * sinSigma * sinSigma) *
            (-3 + 4 * cos2SigmaM * cos2SigmaM)));

  const sMeters = WGS84_B * A * (sigma - deltaSigma);
  return sMeters / 1000;
}

// 5. Straight-line 3D Chord distance through Earth
export function calculateChordDistKm(haversineKm: number): number {
  const c = haversineKm / EARTH_RADIUS_KM;
  return 2 * EARTH_RADIUS_KM * Math.sin(c / 2);
}

// 6. Bearing calculation (Initial, Final, Reverse, Cardinal)
export function calculateBearing(p1: GeoPoint, p2: GeoPoint): BearingInfo {
  const phi1 = toRad(p1.lat);
  const phi2 = toRad(p2.lat);
  const deltaLambda = toRad(normalizeLon(p2.lon - p1.lon));

  // Initial bearing from P1 -> P2
  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const theta = Math.atan2(y, x);
  const initialBearingDeg = (toDeg(theta) + 360) % 360;

  // Final bearing (arrival heading at P2)
  const yRev = Math.sin(-deltaLambda) * Math.cos(phi1);
  const xRev = Math.cos(phi2) * Math.sin(phi1) - Math.sin(phi2) * Math.cos(phi1) * Math.cos(-deltaLambda);
  const thetaRev = Math.atan2(yRev, xRev);
  const reverseBearingDeg = (toDeg(thetaRev) + 360) % 360;
  const finalBearingDeg = (reverseBearingDeg + 180) % 360;

  return {
    initialBearingDeg,
    finalBearingDeg,
    reverseBearingDeg,
    cardinalInitial: degToCardinal(initialBearingDeg),
    cardinalReverse: degToCardinal(reverseBearingDeg),
  };
}

// Convert degrees to 16-wind cardinal compass
export function degToCardinal(deg: number): string {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

// 7. Midpoint on Great Circle
export function calculateMidpoint(p1: GeoPoint, p2: GeoPoint): GeoPoint {
  const phi1 = toRad(p1.lat);
  const lambda1 = toRad(p1.lon);
  const phi2 = toRad(p2.lat);
  const deltaLambda = toRad(normalizeLon(p2.lon - p1.lon));

  const Bx = Math.cos(phi2) * Math.cos(deltaLambda);
  const By = Math.cos(phi2) * Math.sin(deltaLambda);

  const phiM = Math.atan2(
    Math.sin(phi1) + Math.sin(phi2),
    Math.sqrt((Math.cos(phi1) + Bx) * (Math.cos(phi1) + Bx) + By * By)
  );
  const lambdaM = lambda1 + Math.atan2(By, Math.cos(phi1) + Bx);

  return {
    lat: toDeg(phiM),
    lon: normalizeLon(toDeg(lambdaM)),
    label: 'Great-Circle Midpoint',
  };
}

// 8. Antipodal point
export function calculateAntipode(p: GeoPoint): GeoPoint {
  return {
    lat: -p.lat,
    lon: normalizeLon(p.lon + (p.lon > 0 ? -180 : 180)),
    label: `Antipode of ${p.label || 'Point'}`,
  };
}

// 9. Coordinate Differences and Distances along Lat / Lon axes
export function calculateDeltaCoords(p1: GeoPoint, p2: GeoPoint): DeltaCoords {
  const deltaLatDeg = p2.lat - p1.lat;
  const deltaLonDeg = normalizeLon(p2.lon - p1.lon);

  const latDirection: 'North' | 'South' | 'None' =
    deltaLatDeg > 0.000001 ? 'North' : deltaLatDeg < -0.000001 ? 'South' : 'None';
  const lonDirection: 'East' | 'West' | 'None' =
    deltaLonDeg > 0.000001 ? 'East' : deltaLonDeg < -0.000001 ? 'West' : 'None';

  // Distance along latitude line (North/South): 1 deg lat is approx 111.132 km
  const distLatKm = Math.abs(deltaLatDeg) * (Math.PI / 180) * EARTH_RADIUS_KM;

  // Distance along longitude line (East/West) at mean latitude
  const meanLatRad = toRad((p1.lat + p2.lat) / 2);
  const distLonKm = Math.abs(deltaLonDeg) * (Math.PI / 180) * EARTH_RADIUS_KM * Math.cos(meanLatRad);

  return {
    deltaLatDeg,
    deltaLonDeg,
    latDirection,
    lonDirection,
    dmsDeltaLat: toDmsString(Math.abs(deltaLatDeg), latDirection === 'South' ? 'S' : 'N'),
    dmsDeltaLon: toDmsString(Math.abs(deltaLonDeg), lonDirection === 'West' ? 'W' : 'E'),
    distLatKm,
    distLonKm,
    manhattanDistKm: distLatKm + distLonKm,
  };
}

// 10. Travel time estimates
export function calculateTravelTimes(distanceKm: number): TravelTimes {
  return {
    walkingHours: distanceKm / 5, // 5 km/h
    cyclingHours: distanceKm / 20, // 20 km/h
    drivingHours: distanceKm / 85, // 85 km/h
    highSpeedRailHours: distanceKm / 250, // 250 km/h
    flightHours: distanceKm < 300 ? distanceKm / 400 + 0.5 : distanceKm / 850 + 0.75, // Jet cruising + takeoff/approach
    lightLatencyMs: (distanceKm / 299792.458) * 1000, // speed of light in vacuum (one-way ms)
  };
}

// 11. Geofence test
export function checkGeofence(center: GeoPoint, target: GeoPoint, radiusMeters: number): GeofenceResult {
  const distKm = calculateHaversineKm(center, target);
  const distanceToCenterMeters = distKm * 1000;
  const isInside = distanceToCenterMeters <= radiusMeters;
  const marginMeters = Math.abs(distanceToCenterMeters - radiusMeters);

  return {
    radiusMeters,
    isInside,
    distanceToCenterMeters,
    marginMeters,
  };
}

// Master comprehensive calculation
export function computeFullGeodesic(p1: GeoPoint, p2: GeoPoint): GeodesicResult {
  const havKm = calculateHaversineKm(p1, p2);
  const vincKm = calculateVincentyKm(p1, p2);
  const cosKm = calculateLawOfCosinesKm(p1, p2);
  const flatKm = calculateFlatEarthKm(p1, p2);
  const chordKm = calculateChordDistKm(havKm);

  return {
    haversine: toDistanceUnits(havKm),
    vincenty: vincKm !== null ? toDistanceUnits(vincKm) : null,
    lawOfCosines: toDistanceUnits(cosKm),
    flatEarth: toDistanceUnits(flatKm),
    tunnelChordDistKm: chordKm,
    delta: calculateDeltaCoords(p1, p2),
    bearing: calculateBearing(p1, p2),
    midpoint: calculateMidpoint(p1, p2),
    antipodeA: calculateAntipode(p1),
    antipodeB: calculateAntipode(p2),
    travelTimes: calculateTravelTimes(vincKm ?? havKm),
  };
}

// DMS Formatter
export function toDmsString(decimal: number, hemisphere: 'N' | 'S' | 'E' | 'W'): string {
  const abs = Math.abs(decimal);
  const d = Math.floor(abs);
  const minFloat = (abs - d) * 60;
  const m = Math.floor(minFloat);
  const s = ((minFloat - m) * 60).toFixed(2);
  return `${d}° ${m}' ${s}" ${hemisphere}`;
}

// DDM Formatter (Degrees and Decimal Minutes)
export function toDdmString(decimal: number, hemisphere: 'N' | 'S' | 'E' | 'W'): string {
  const abs = Math.abs(decimal);
  const d = Math.floor(abs);
  const min = ((abs - d) * 60).toFixed(4);
  return `${d}° ${min}' ${hemisphere}`;
}

// Convert DMS / text string to Decimal Degrees
export function parseDms(dmsStr: string): number | null {
  const clean = dmsStr.trim().replace(/['"]/g, match => (match === '"' ? '″' : '′'));
  // Match e.g. 37° 46' 29.64" N or 37°46'29.64"N or 37 46 29.64 N
  const match = clean.match(/([+-]?\d+(?:\.\d+)?)[°\s]+(?:(\d+(?:\.\d+)?)[′'\s]+)?(?:(\d+(?:\.\d+)?)[″"]?\s*)?([NSEW])?/i);
  if (!match) return null;

  const deg = parseFloat(match[1]) || 0;
  const min = parseFloat(match[2]) || 0;
  const sec = parseFloat(match[3]) || 0;
  const hemi = match[4]?.toUpperCase();

  let dd = deg + min / 60 + sec / 3600;
  if (hemi === 'S' || hemi === 'W') {
    dd = -Math.abs(dd);
  }
  return dd;
}

// Universal flexible coordinate parser
// Supports: "37.7749, -122.4194", "37° 46' N, 122° 25' W", "[ -122.4194, 37.7749 ]", etc.
export function parseCoordinateInput(input: string): GeoPoint | null {
  if (!input || !input.trim()) return null;
  const str = input.trim();

  // 1. JSON Array format: [lon, lat] or [lat, lon]
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const arr = JSON.parse(str);
      if (Array.isArray(arr) && arr.length >= 2) {
        const v0 = Number(arr[0]);
        const v1 = Number(arr[1]);
        if (!isNaN(v0) && !isNaN(v1)) {
          // Standard GeoJSON is [longitude, latitude]
          if (Math.abs(v0) <= 180 && Math.abs(v1) <= 90 && (Math.abs(v0) > 90 || Math.abs(v1) <= 90)) {
            return { lat: clampLat(v1), lon: normalizeLon(v0) };
          }
          return { lat: clampLat(v0), lon: normalizeLon(v1) };
        }
      }
    } catch {
      // not json, continue
    }
  }

  // 2. Check for DMS hemisphere letters (N/S and E/W)
  if (/[NSEW]/i.test(str)) {
    // Split by comma, semicolon, or slash
    const parts = str.split(/[,;/]|\sand\s/i).map(p => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const latVal = parseDms(parts[0]);
      const lonVal = parseDms(parts[1]);
      if (latVal !== null && lonVal !== null) {
        return { lat: clampLat(latVal), lon: normalizeLon(lonVal) };
      }
    }
  }

  // 3. Decimal format: "37.7749, -122.4194" or "37.7749 -122.4194" or "lat: 37.7749, lon: -122.4194"
  // Clean up common labels
  const stripped = str
    .replace(/lat(itude)?\s*[:=]/gi, '')
    .replace(/lon(gitude)?\s*[:=]/gi, '')
    .replace(/[^\d.,+-\s]/g, ' ')
    .trim();

  const numbers = stripped
    .split(/[\s,;]+/)
    .map(Number)
    .filter(n => !isNaN(n));

  if (numbers.length >= 2) {
    const lat = numbers[0];
    const lon = numbers[1];
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

// Parses a combined string that contains both coordinates, e.g.:
// "37.7749, -122.4194 to 40.7128, -74.0060" or "37.7749,-122.4194 / 40.7128,-74.0060"
export function parseDualCoordinates(input: string): { p1: GeoPoint; p2: GeoPoint } | null {
  if (!input) return null;
  const splitMatch = input.split(/\s+(?:to|->|-->|=>|and|\/|;)\s+/i);
  if (splitMatch.length === 2) {
    const p1 = parseCoordinateInput(splitMatch[0]);
    const p2 = parseCoordinateInput(splitMatch[1]);
    if (p1 && p2) return { p1, p2 };
  }

  // Line-by-line fallback
  const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    const p1 = parseCoordinateInput(lines[0]);
    const p2 = parseCoordinateInput(lines[1]);
    if (p1 && p2) return { p1, p2 };
  }

  return null;
}

// Format duration into readable hours, minutes, seconds
export function formatHours(hours: number): string {
  if (hours < 0.016) {
    const seconds = Math.round(hours * 3600);
    return `${seconds} sec`;
  }
  if (hours < 1) {
    const minutes = Math.round(hours * 60);
    return `${minutes} min`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h >= 24) {
    const days = (hours / 24).toFixed(1);
    return `${days} days (${h}h ${m}m)`;
  }
  return `${h}h ${m}m`;
}
