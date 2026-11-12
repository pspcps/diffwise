import React, { useState, useMemo } from 'react';
import type { GeoPoint, GeodesicResult } from './types';
import { Compass, Navigation2 } from 'lucide-react';

interface GeoMapCanvasProps {
  pointA: GeoPoint;
  pointB: GeoPoint;
  result: GeodesicResult;
  geofenceRadiusMeters?: number;
  showGeofence?: boolean;
  onPointChange?: (point: 'A' | 'B', lat: number, lon: number) => void;
}

export const GeoMapCanvas: React.FC<GeoMapCanvasProps> = ({
  pointA,
  pointB,
  result,
  geofenceRadiusMeters = 5000,
  showGeofence = false,
  onPointChange,
}) => {
  const [viewMode, setViewMode] = useState<'world' | 'local'>('world');
  const [showDeltaTriangle, setShowDeltaTriangle] = useState(true);

  // SVG viewBox coordinates: width 900, height 460
  const SVG_W = 900;
  const SVG_H = 460;

  // Converts Lat/Lon to SVG World coordinates (Equirectangular)
  const worldLatLonToSvg = (lat: number, lon: number): [number, number] => {
    // lon [-180..180] -> [0..SVG_W]
    const x = ((lon + 180) / 360) * SVG_W;
    // lat [90..-90] -> [0..SVG_H]
    const y = ((90 - lat) / 180) * SVG_H;
    return [x, y];
  };

  // Local zoomed coordinates bounding box
  const localBounds = useMemo(() => {
    const minLat = Math.min(pointA.lat, pointB.lat);
    const maxLat = Math.max(pointA.lat, pointB.lat);
    const minLon = Math.min(pointA.lon, pointB.lon);
    const maxLon = Math.max(pointA.lon, pointB.lon);

    const latSpan = Math.max(0.01, maxLat - minLat);
    const lonSpan = Math.max(0.01, maxLon - minLon);

    const padLat = Math.max(0.005, latSpan * 0.35);
    const padLon = Math.max(0.005, lonSpan * 0.35);

    return {
      minLat: Math.max(-90, minLat - padLat),
      maxLat: Math.min(90, maxLat + padLat),
      minLon: Math.max(-180, minLon - padLon),
      maxLon: Math.min(180, maxLon + padLon),
    };
  }, [pointA, pointB]);

  const localLatLonToSvg = (lat: number, lon: number): [number, number] => {
    const { minLat, maxLat, minLon, maxLon } = localBounds;
    const x = ((lon - minLon) / (maxLon - minLon)) * (SVG_W - 120) + 60;
    const y = ((maxLat - lat) / (maxLat - minLat)) * (SVG_H - 100) + 50;
    return [x, y];
  };

  const projectPoint = viewMode === 'world' ? worldLatLonToSvg : localLatLonToSvg;

  const [ax, ay] = projectPoint(pointA.lat, pointA.lon);
  const [bx, by] = projectPoint(pointB.lat, pointB.lon);
  const [midX, midY] = projectPoint(result.midpoint.lat, result.midpoint.lon);

  // Delta triangle corner: (pointA.lat, pointB.lon) or (pointB.lat, pointA.lon)
  const [cornerX, cornerY] = projectPoint(pointB.lat, pointA.lon);

  // Geodesic path curve points (generate 24 intermediate points along great circle)
  const pathD = useMemo(() => {
    if (viewMode === 'local') {
      return `M ${ax} ${ay} L ${bx} ${by}`;
    }

    // Great circle interpolation in world mode
    const points: [number, number][] = [];
    const steps = 30;
    const radA = (pointA.lat * Math.PI) / 180;
    const radB = (pointB.lat * Math.PI) / 180;
    const lonA = (pointA.lon * Math.PI) / 180;
    const lonB = (pointB.lon * Math.PI) / 180;
    const dLon = lonB - lonA;

    const d =
      2 *
      Math.asin(
        Math.sqrt(
          Math.sin((radB - radA) / 2) ** 2 +
            Math.cos(radA) * Math.cos(radB) * Math.sin(dLon / 2) ** 2
        )
      );

    if (d < 1e-6) {
      return `M ${ax} ${ay} L ${bx} ${by}`;
    }

    for (let i = 0; i <= steps; i++) {
      const f = i / steps;
      const A = Math.sin((1 - f) * d) / Math.sin(d);
      const B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(radA) * Math.cos(lonA) + B * Math.cos(radB) * Math.cos(lonB);
      const y = A * Math.cos(radA) * Math.sin(lonA) + B * Math.cos(radB) * Math.sin(lonB);
      const z = A * Math.sin(radA) + B * Math.sin(radB);
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
      const lon = Math.atan2(y, x) * (180 / Math.PI);

      const [sx, sy] = worldLatLonToSvg(lat, lon);
      points.push([sx, sy]);
    }

    // Connect with M ... L ...
    let dStr = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      // Check for 180 meridian wrap jump
      if (Math.abs(points[i][0] - points[i - 1][0]) > SVG_W / 2) {
        dStr += ` M ${points[i][0]} ${points[i][1]}`;
      } else {
        dStr += ` L ${points[i][0]} ${points[i][1]}`;
      }
    }
    return dStr;
  }, [ax, ay, bx, by, pointA, pointB, viewMode]);

  // Click on canvas to adjust Point B (or Point A with shift key)
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPointChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * SVG_W;
    const clickY = ((e.clientY - rect.top) / rect.height) * SVG_H;

    let targetLat = 0;
    let targetLon = 0;

    if (viewMode === 'world') {
      targetLon = (clickX / SVG_W) * 360 - 180;
      targetLat = 90 - (clickY / SVG_H) * 180;
    } else {
      const { minLat, maxLat, minLon, maxLon } = localBounds;
      targetLon = ((clickX - 60) / (SVG_W - 120)) * (maxLon - minLon) + minLon;
      targetLat = maxLat - ((clickY - 50) / (SVG_H - 100)) * (maxLat - minLat);
    }

    const targetPoint = e.shiftKey ? 'A' : 'B';
    onPointChange(targetPoint, Number(targetLat.toFixed(5)), Number(targetLon.toFixed(5)));
  };

  return (
    <div className="relative rounded-xl border border-[#313244] bg-[#11111b] overflow-hidden shadow-2xl">
      {/* Canvas Top Bar Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-[#181825]/90 border-b border-[#313244] text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-[#cdd6f4]">
            <Compass size={14} className="text-[#89b4fa]" />
            <span>Geodesic Trajectory & Coordinate Delta Projection</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#313244] text-[#a6adc8]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#a6e3a1]"></span> Point A
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f38ba8]"></span> Point B
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#94e2d5]"></span> Midpoint
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Delta Triangle Toggle */}
          <button
            type="button"
            onClick={() => setShowDeltaTriangle(!showDeltaTriangle)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors border ${
              showDeltaTriangle
                ? 'bg-[#cba6f7]/15 border-[#cba6f7]/40 text-[#cba6f7]'
                : 'bg-[#181825] border-[#313244] text-[#6c7086] hover:text-[#cdd6f4]'
            }`}
          >
            Δ Lat/Lon Triangle: {showDeltaTriangle ? 'ON' : 'OFF'}
          </button>

          {/* Mode Switcher */}
          <div className="inline-flex rounded-lg bg-[#11111b] p-0.5 border border-[#313244]">
            <button
              type="button"
              onClick={() => setViewMode('world')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'world' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#a6adc8]'
              }`}
            >
              World View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('local')}
              className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors ${
                viewMode === 'local' ? 'bg-[#313244] text-[#cdd6f4]' : 'text-[#6c7086] hover:text-[#a6adc8]'
              }`}
            >
              Focus Path
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Visualization */}
      <div className="relative w-full aspect-[16/8] max-h-[440px] select-none bg-[#11111b] cursor-crosshair">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full h-full"
          onClick={handleSvgClick}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a6e3a1" />
              <stop offset="50%" stopColor="#94e2d5" />
              <stop offset="100%" stopColor="#f38ba8" />
            </linearGradient>

            <linearGradient id="deltaLatGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fab387" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#fab387" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="deltaLonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#89b4fa" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#89b4fa" stopOpacity="0.3" />
            </linearGradient>

            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowRose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid Lines */}
          <g className="opacity-20" stroke="#45475a" strokeDasharray="3,3">
            {/* Equator & Tropics in World mode */}
            {viewMode === 'world' ? (
              <>
                <line x1="0" y1={SVG_H / 2} x2={SVG_W} y2={SVG_H / 2} stroke="#89b4fa" strokeWidth="1.2" strokeDasharray="none" />
                <line x1={SVG_W / 2} y1="0" x2={SVG_W / 2} y2={SVG_H} stroke="#89b4fa" strokeWidth="1.2" strokeDasharray="none" />
                {/* 30 and 60 deg lat lines */}
                <line x1="0" y1={SVG_H / 6} x2={SVG_W} y2={SVG_H / 6} />
                <line x1="0" y1={SVG_H / 3} x2={SVG_W} y2={SVG_H / 3} />
                <line x1="0" y1={(SVG_H * 2) / 3} x2={SVG_W} y2={(SVG_H * 2) / 3} />
                <line x1="0" y1={(SVG_H * 5) / 6} x2={SVG_W} y2={(SVG_H * 5) / 6} />
                {/* Longitude lines */}
                <line x1={SVG_W / 4} y1="0" x2={SVG_W / 4} y2={SVG_H} />
                <line x1={(SVG_W * 3) / 4} y1="0" x2={(SVG_W * 3) / 4} y2={SVG_H} />
              </>
            ) : (
              /* Local Cartesian Grid */
              Array.from({ length: 9 }).map((_, i) => (
                <g key={i}>
                  <line x1={(SVG_W / 8) * i} y1="0" x2={(SVG_W / 8) * i} y2={SVG_H} stroke="#313244" />
                  <line x1="0" y1={(SVG_H / 8) * i} x2={SVG_W} y2={(SVG_H / 8) * i} stroke="#313244" />
                </g>
              ))
            )}
          </g>

          {/* Labels for Equator & Prime Meridian in World view */}
          {viewMode === 'world' && (
            <g fill="#6c7086" fontSize="10" fontFamily="monospace">
              <text x="12" y={SVG_H / 2 - 6}>0° Equator</text>
              <text x={SVG_W / 2 + 8} y="20">0° Prime Meridian</text>
              <text x="12" y="24">+90° N</text>
              <text x="12" y={SVG_H - 10}>-90° S</text>
              <text x={SVG_W - 60} y={SVG_H / 2 - 6}>+180° E</text>
              <text x="12" y={SVG_H / 2 + 16}>-180° W</text>
            </g>
          )}

          {/* Delta Triangle (Shows visual Lat diff and Lon diff legs) */}
          {showDeltaTriangle && (
            <g>
              {/* Triangle shading */}
              <polygon
                points={`${ax},${ay} ${cornerX},${cornerY} ${bx},${by}`}
                fill="#cba6f7"
                fillOpacity="0.06"
                stroke="#cba6f7"
                strokeWidth="1"
                strokeDasharray="4,4"
              />

              {/* Vertical ΔLat leg (from Point A to Corner) */}
              <line
                x1={ax}
                y1={ay}
                x2={cornerX}
                y2={cornerY}
                stroke="#fab387"
                strokeWidth="2.5"
                strokeDasharray="5,3"
              />

              {/* Horizontal ΔLon leg (from Corner to Point B) */}
              <line
                x1={cornerX}
                y1={cornerY}
                x2={bx}
                y2={by}
                stroke="#89b4fa"
                strokeWidth="2.5"
                strokeDasharray="5,3"
              />

              {/* ΔLat callout tag */}
              <g transform={`translate(${(ax + cornerX) / 2 + 10}, ${(ay + cornerY) / 2})`}>
                <rect x="-6" y="-12" width="130" height="22" rx="4" fill="#181825" stroke="#fab387" strokeWidth="1" />
                <text x="4" y="2" fill="#fab387" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  ΔLat: {result.delta.distLatKm.toFixed(1)} km ({result.delta.latDirection})
                </text>
              </g>

              {/* ΔLon callout tag */}
              <g transform={`translate(${(cornerX + bx) / 2 - 60}, ${(cornerY + by) / 2 + 20})`}>
                <rect x="-6" y="-12" width="130" height="22" rx="4" fill="#181825" stroke="#89b4fa" strokeWidth="1" />
                <text x="4" y="2" fill="#89b4fa" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  ΔLon: {result.delta.distLonKm.toFixed(1)} km ({result.delta.lonDirection})
                </text>
              </g>
            </g>
          )}

          {/* Geofence Perimeter Circle around Point A (if local or small radius) */}
          {showGeofence && (
            <g>
              {/* Approximate radius in SVG pixels */}
              <circle
                cx={ax}
                cy={ay}
                r={Math.max(12, Math.min(180, (geofenceRadiusMeters / 1000 / result.haversine.km) * Math.hypot(bx - ax, by - ay)))}
                fill="#89b4fa"
                fillOpacity="0.12"
                stroke="#89b4fa"
                strokeWidth="1.5"
                strokeDasharray="4,2"
              />
            </g>
          )}

          {/* Geodesic Flight Path / Great Circle */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Directional Pulse or Line Markers */}
          <path
            d={pathD}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            strokeDasharray="6,18"
            className="opacity-70"
          />

          {/* Midpoint Marker */}
          <g filter="url(#glowCyan)">
            <circle cx={midX} cy={midY} r="5" fill="#94e2d5" />
            <circle cx={midX} cy={midY} r="9" fill="none" stroke="#94e2d5" strokeWidth="1.2" strokeDasharray="3,2" />
          </g>

          {/* Point A (Origin / Green Pin) */}
          <g filter="url(#glowGreen)">
            <circle cx={ax} cy={ay} r="14" fill="#a6e3a1" fillOpacity="0.2" />
            <circle cx={ax} cy={ay} r="7" fill="#a6e3a1" />
            <circle cx={ax} cy={ay} r="2.5" fill="#11111b" />
          </g>
          <g transform={`translate(${ax + 12}, ${ay - 8})`}>
            <rect x="0" y="-12" width="90" height="20" rx="4" fill="#181825" stroke="#a6e3a1" strokeWidth="1" />
            <text x="6" y="2" fill="#a6e3a1" fontSize="10" fontWeight="bold">
              {pointA.label || 'Point A'}
            </text>
          </g>

          {/* Point B (Destination / Rose Pin) */}
          <g filter="url(#glowRose)">
            <circle cx={bx} cy={by} r="14" fill="#f38ba8" fillOpacity="0.2" />
            <circle cx={bx} cy={by} r="7" fill="#f38ba8" />
            <circle cx={bx} cy={by} r="2.5" fill="#11111b" />
          </g>
          <g transform={`translate(${bx + 12}, ${by - 8})`}>
            <rect x="0" y="-12" width="90" height="20" rx="4" fill="#181825" stroke="#f38ba8" strokeWidth="1" />
            <text x="6" y="2" fill="#f38ba8" fontSize="10" fontWeight="bold">
              {pointB.label || 'Point B'}
            </text>
          </g>

          {/* Center Callout Pill: Total Great-Circle Distance */}
          <g transform={`translate(${midX - 75}, ${midY - 26})`}>
            <rect
              x="0"
              y="0"
              width="150"
              height="26"
              rx="6"
              fill="#181825"
              fillOpacity="0.95"
              stroke="#94e2d5"
              strokeWidth="1.5"
            />
            <text x="75" y="17" fill="#cdd6f4" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              {result.haversine.km.toLocaleString(undefined, { maximumFractionDigits: 1 })} km / {result.haversine.miles.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi
            </text>
          </g>
        </svg>

        {/* Floating Compass Rose (HUD overlay in bottom-right) */}
        <div className="absolute bottom-3 right-3 p-2.5 rounded-xl bg-[#181825]/90 border border-[#313244] shadow-lg flex items-center gap-3 backdrop-blur-sm">
          <div className="relative w-10 h-10 rounded-full border border-[#45475a] bg-[#11111b] flex items-center justify-center">
            {/* North marker */}
            <span className="absolute top-0.5 text-[8px] font-bold text-[#f38ba8]">N</span>
            <span className="absolute bottom-0.5 text-[8px] text-[#6c7086]">S</span>
            <span className="absolute right-0.5 text-[8px] text-[#6c7086]">E</span>
            <span className="absolute left-0.5 text-[8px] text-[#6c7086]">W</span>

            {/* Rotating Heading Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-500"
              style={{ transform: `rotate(${result.bearing.initialBearingDeg}deg)` }}
            >
              <Navigation2 size={16} className="text-[#89b4fa] fill-[#89b4fa]" />
            </div>
          </div>

          <div className="text-[11px] leading-tight">
            <div className="text-[#a6adc8]">Initial Bearing</div>
            <div className="font-mono font-bold text-[#cdd6f4]">
              {result.bearing.initialBearingDeg.toFixed(1)}° ({result.bearing.cardinalInitial})
            </div>
            <div className="text-[10px] text-[#9399b2]">
              Final: {result.bearing.finalBearingDeg.toFixed(1)}°
            </div>
          </div>
        </div>

        {/* Tip pill in bottom-left */}
        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[#181825]/80 border border-[#313244] text-[10px] text-[#a6adc8] pointer-events-none">
          Click map to relocate <span className="text-[#f38ba8] font-bold">Point B</span> (Hold <kbd className="px-1 py-0.5 bg-[#313244] rounded text-[9px]">Shift</kbd> for <span className="text-[#a6e3a1] font-bold">Point A</span>)
        </div>
      </div>
    </div>
  );
};
