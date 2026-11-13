import type { GeoPoint } from "./types";

/** Great-circle samples with continuous longitude across the date line. */
export function geodesicPath(a: GeoPoint, b: GeoPoint): [number, number][] {
  const radians = Math.PI / 180;
  const vector = (p: GeoPoint) => [
    Math.cos(p.lat * radians) * Math.cos(p.lon * radians),
    Math.cos(p.lat * radians) * Math.sin(p.lon * radians),
    Math.sin(p.lat * radians),
  ];
  const start = vector(a),
    end = vector(b);
  const dot = Math.max(
    -1,
    Math.min(
      1,
      start.reduce((sum, v, i) => sum + v * end[i], 0),
    ),
  );
  const angle = Math.acos(dot);
  let tangent = end.map((v, i) => v - dot * start[i]);
  let length = Math.hypot(...tangent);
  if (length < 1e-10) {
    // Coincident points need no curve; antipodes have many equally short paths.
    if (dot > 0)
      return [
        [a.lat, a.lon],
        [b.lat, a.lon],
      ];
    const axis = Math.abs(start[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const projection = axis.reduce((sum, v, i) => sum + v * start[i], 0);
    tangent = axis.map((v, i) => v - projection * start[i]);
    length = Math.hypot(...tangent);
  }
  tangent = tangent.map((v) => v / length);
  const path: [number, number][] = [];
  let previousLon = a.lon;
  for (let i = 0; i <= 128; i++) {
    const t = (angle * i) / 128;
    const xyz = start.map((v, j) => Math.cos(t) * v + Math.sin(t) * tangent[j]);
    const lat = Math.atan2(xyz[2], Math.hypot(xyz[0], xyz[1])) / radians;
    let lon = Math.atan2(xyz[1], xyz[0]) / radians;
    while (lon - previousLon > 180) lon -= 360;
    while (lon - previousLon < -180) lon += 360;
    path.push([lat, lon]);
    previousLon = lon;
  }
  return path;
}
