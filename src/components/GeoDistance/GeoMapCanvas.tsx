import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./geo-map.css";
import { LocateFixed, MapPinned } from "lucide-react";
import type { GeoPoint, GeodesicResult } from "./types";
import { geodesicPath } from "./geodesicPath";

interface GeoMapCanvasProps {
  pointA: GeoPoint;
  pointB: GeoPoint;
  result: GeodesicResult;
  geofenceRadiusMeters?: number;
  showGeofence?: boolean;
  onPointChange?: (point: "A" | "B", lat: number, lon: number) => void;
}
const formatDistance = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 2 });
const coords = (p: GeoPoint) =>
  `${p.lat.toFixed(5)}° lat, ${p.lon.toFixed(5)}° lon`;
const valid = (p: GeoPoint) =>
  Number.isFinite(p.lat) &&
  Number.isFinite(p.lon) &&
  Math.abs(p.lat) <= 90 &&
  Math.abs(p.lon) <= 180;
const textContent = (text: string) => {
  const node = document.createElement("span");
  node.textContent = text;
  return node;
};

export function GeoMapCanvas({
  pointA,
  pointB,
  result,
  geofenceRadiusMeters = 5000,
  showGeofence = false,
  onPointChange,
}: GeoMapCanvasProps) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const [target, setTarget] = useState<"A" | "B">("B");
  const interaction = useRef({ target, onPointChange });
  const [tileError, setTileError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [unit, setUnit] = useState("km");
  const routeKey = `${pointA.lat},${pointA.lon};${pointB.lat},${pointB.lon}`;
  const [road, setRoad] = useState<{
    key: string;
    status: "loading" | "ready" | "error";
    km?: number;
    minutes?: number;
    path?: [number, number][];
    error?: string;
  } | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const activeRoad = road?.key === routeKey ? road : null;
  const factors: Record<string, number> = {
    km: 1,
    m: 1000,
    mi: 0.621371192237334,
    ft: 3280.83989501312,
    nmi: 0.539956803455724,
  };
  const measured = (km: number) =>
    `${formatDistance(km * factors[unit])} ${unit}`;
  useEffect(() => () => requestRef.current?.abort(), []);
  async function getDrivingRoute() {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setRoad({ key: routeKey, status: "loading" });
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pointA.lon},${pointA.lat};${pointB.lon},${pointB.lat}?overview=full&geometries=geojson&steps=false`,
        { signal: controller.signal },
      );
      if (!response.ok)
        throw new Error("The free routing service is temporarily unavailable.");
      const data = await response.json();
      const route = data.routes?.[0];
      if (
        data.code !== "Ok" ||
        !route ||
        !Number.isFinite(route.distance) ||
        !Number.isFinite(route.duration) ||
        route.distance < 0 ||
        route.duration < 0 ||
        !Array.isArray(route.geometry?.coordinates)
      )
        throw new Error(
          "No driving route was found between these points. Try two points connected by roads.",
        );
      const path: [number, number][] = route.geometry.coordinates.map(
        (p: number[]) => [p[1], p[0]],
      );
      if (
        path.length < 2 ||
        path.some(
          (p) =>
            !Number.isFinite(p[0]) ||
            !Number.isFinite(p[1]) ||
            Math.abs(p[0]) > 90 ||
            Math.abs(p[1]) > 180,
        )
      )
        throw new Error("The routing service returned an invalid path.");
      let previousLongitude = pointA.lon;
      for (const point of path) {
        while (point[1] - previousLongitude > 180) point[1] -= 360;
        while (point[1] - previousLongitude < -180) point[1] += 360;
        previousLongitude = point[1];
      }
      setRoad({
        key: routeKey,
        status: "ready",
        km: route.distance / 1000,
        minutes: route.duration / 60,
        path,
      });
    } catch (error) {
      if (requestRef.current !== controller) return;
      setRoad({
        key: routeKey,
        status: "error",
        error: controller.signal.aborted
          ? "Routing timed out. Your direct-distance calculation is still available."
          : error instanceof Error
            ? error.message
            : "Could not load the driving route.",
      });
    } finally {
      clearTimeout(timeout);
    }
  }
  useEffect(() => {
    interaction.current = { target, onPointChange };
  }, [target, onPointChange]);

  useEffect(() => {
    if (!container.current) return;
    const map = L.map(container.current, {
      scrollWheelZoom: false,
      worldCopyJump: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView([20, 0], 2);
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1,
      },
    ).addTo(map);
    tiles.on("tileerror", () => setTileError(true));
    map.on("click", (event: L.LeafletMouseEvent) => {
      const { target: pin, onPointChange: change } = interaction.current;
      change?.(
        pin,
        Number(event.latlng.lat.toFixed(5)),
        Number(event.latlng.wrap().lng.toFixed(5)),
      );
    });
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ animate: false }),
    );
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current,
      layers = layerRef.current;
    if (!map || !layers) return;
    layers.clearLayers();
    if (!valid(pointA) || !valid(pointB)) return;
    const route = geodesicPath(pointA, pointB);
    const line = L.polyline(route, {
      color: "#286774",
      weight: 4,
      opacity: 0.95,
    }).addTo(layers);
    if (activeRoad?.path)
      L.polyline(activeRoad.path, {
        color: "#b34b17",
        weight: 5,
        opacity: 0.95,
      })
        .bindTooltip("Driving route · OSRM")
        .addTo(layers);
    boundsRef.current = line.getBounds();
    const middle = route[Math.floor(route.length / 2)];
    L.marker(middle, {
      interactive: false,
      icon: L.divIcon({
        className: "geo-distance-anchor",
        html: "",
        iconSize: [0, 0],
      }),
    })
      .bindTooltip(
        textContent(
          `${formatDistance(result.haversine.km)} km · ${formatDistance(result.haversine.miles)} mi`,
        ),
        {
          permanent: true,
          direction: "top",
          className: "geo-distance-label",
          offset: [0, -12],
        },
      )
      .addTo(layers);
    (
      [
        ["A", pointA, route[0]],
        ["B", pointB, route[route.length - 1]],
      ] as const
    ).forEach(([pin, point, position]) => {
      const marker = L.marker(position, {
        draggable: Boolean(onPointChange),
        title: `Point ${pin}: ${coords(point)}${onPointChange ? ". Drag to move." : ""}`,
        alt: `Point ${pin}`,
        icon: L.divIcon({
          className: `geo-pin geo-pin-${pin.toLowerCase()}`,
          html: `<span>${pin}</span>`,
          iconSize: [34, 42],
          iconAnchor: [17, 42],
        }),
      }).addTo(layers);
      marker.bindPopup(
        textContent(
          `Point ${pin}${point.label ? ` · ${point.label}` : ""}\n${coords(point)}`,
        ),
      );
      marker.on("dragend", () => {
        const position = marker.getLatLng().wrap();
        interaction.current.onPointChange?.(
          pin,
          Number(Math.max(-90, Math.min(90, position.lat)).toFixed(5)),
          Number(position.lng.toFixed(5)),
        );
      });
    });
    if (showGeofence)
      L.circle(route[0], {
        radius: geofenceRadiusMeters,
        color: "#286774",
        fillOpacity: 0.12,
      }).addTo(layers);
    if (activeRoad?.path)
      boundsRef.current.extend(L.latLngBounds(activeRoad.path));
    map.fitBounds(boundsRef.current, {
      padding: [60, 65],
      maxZoom: 16,
      animate: false,
    });
  }, [
    pointA,
    pointB,
    result,
    geofenceRadiusMeters,
    showGeofence,
    onPointChange,
    activeRoad,
  ]);

  useEffect(() => {
    if (!retry) return;
    mapRef.current?.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) layer.redraw();
    });
  }, [retry]);

  const validPoints = valid(pointA) && valid(pointB);
  return (
    <section className="geo-map-panel" aria-label="Interactive distance map">
      <div className="geo-map-toolbar">
        <div>
          <MapPinned size={18} />
          <strong>Explore the distance</strong>
        </div>
        <div className="geo-map-actions">
          <label>
            Distance unit{" "}
            <select
              aria-label="Map distance unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {Object.keys(factors).map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          {onPointChange && (
            <div role="group" aria-label="Choose a pin to place">
              {(["A", "B"] as const).map((pin) => (
                <button
                  key={pin}
                  type="button"
                  aria-pressed={target === pin}
                  onClick={() => setTarget(pin)}
                >
                  Place {pin}
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (boundsRef.current)
                mapRef.current?.fitBounds(boundsRef.current, {
                  padding: [60, 65],
                  maxZoom: 16,
                  animate: false,
                });
            }}
          >
            <LocateFixed size={15} /> Fit points
          </button>
        </div>
      </div>
      <p className="geo-map-hint">
        {onPointChange
          ? `Click the map to place ${target}, or drag either pin. `
          : ""}
        Pan to explore; use + / − to zoom.
      </p>
      {!validPoints && (
        <p className="geo-map-notice" role="status">
          Enter latitude between −90 and 90 and longitude between −180 and 180
          to show your points.
        </p>
      )}
      {tileError && (
        <p className="geo-map-notice" role="status">
          Some map tiles could not load. Pins and distance still work.{" "}
          <button
            type="button"
            onClick={() => {
              setTileError(false);
              setRetry((n) => n + 1);
            }}
          >
            Retry map
          </button>
        </p>
      )}
      <div
        ref={container}
        className="geo-map-surface"
        role="region"
        aria-label="Map with draggable origin and destination pins"
      />
      <div className="geo-map-summary">
        <div>
          <span className="geo-point-badge">A</span>
          <div>
            <strong>{pointA.label || "Origin"}</strong>
            <span>{coords(pointA)}</span>
          </div>
        </div>
        <div>
          <span className="geo-point-badge geo-point-badge-b">B</span>
          <div>
            <strong>{pointB.label || "Destination"}</strong>
            <span>{coords(pointB)}</span>
          </div>
        </div>
        <div className="geo-map-distance" aria-live="polite">
          <strong>{validPoints ? measured(result.haversine.km) : "—"}</strong>
          <span>
            Direct distance ·{" "}
            {validPoints ? formatDistance(result.haversine.miles) : "—"} mi
          </span>
        </div>
      </div>
      <div className="geo-road-controls">
        <div>
          <strong>Follow the roads</strong>
          <p>
            Optional driving route for points up to 500 km apart. Requests send
            these coordinates to the free OSRM public service.
          </p>
        </div>
        <button
          type="button"
          disabled={
            !validPoints ||
            result.haversine.km > 500 ||
            result.haversine.km < 0.001 ||
            activeRoad?.status === "loading"
          }
          onClick={getDrivingRoute}
        >
          {activeRoad?.status === "loading"
            ? "Finding route…"
            : "Get driving route"}
        </button>
        <div role="status" className="geo-road-result">
          {activeRoad?.status === "ready" && (
            <>
              <strong>
                Driving route: {measured(activeRoad.km!)} · about{" "}
                {Math.round(activeRoad.minutes!)} min
              </strong>
              <span>
                Orange: road route · Teal: direct great-circle path. Road
                endpoints may snap to nearby roads. Time excludes live traffic.
              </span>
            </>
          )}
          {activeRoad?.status === "error" && (
            <span>{activeRoad.error} You can retry.</span>
          )}
          {result.haversine.km > 500 && (
            <span>Choose a closer pair of points to request a road route.</span>
          )}
        </div>
      </div>
      <p className="geo-map-footnote">
        OpenStreetMap basemap · OSRM routing · no API key. Map and routing
        require internet; public services may be unavailable. Direct distances
        and unit conversions run locally.
      </p>
    </section>
  );
}
