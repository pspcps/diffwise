import React, { useState, useMemo, useCallback } from 'react';
import {
  Compass,
  ArrowRightLeft,
  Copy,
  Check,
  Share2,
  Download,
  Crosshair,
  Ruler,
  Clock,
  Layers,
  Code,
  ListPlus,
  FileSpreadsheet,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import type { GeoPoint, BatchPairItem } from './types';
import {
  computeFullGeodesic,
  parseCoordinateInput,
  parseDualCoordinates,
  checkGeofence,
  formatHours,
  toDmsString,
  calculateHaversineKm,
  calculateBearing,
} from './geoUtils';
import { GEO_PRESETS } from './presets';
import { GeoMapCanvas } from './GeoMapCanvas';

function getInitialGeoState(): { a: GeoPoint; b: GeoPoint } {
  try {
    const hash = window.location.hash;
    if (hash.includes('?')) {
      const queryStr = hash.split('?')[1];
      const params = new URLSearchParams(queryStr);
      const l1 = params.get('lat1');
      const o1 = params.get('lon1');
      const l2 = params.get('lat2');
      const o2 = params.get('lon2');
      if (l1 && o1 && l2 && o2) {
        const lat1Num = parseFloat(l1);
        const lon1Num = parseFloat(o1);
        const lat2Num = parseFloat(l2);
        const lon2Num = parseFloat(o2);
        if (!isNaN(lat1Num) && !isNaN(lon1Num) && !isNaN(lat2Num) && !isNaN(lon2Num)) {
          return {
            a: { lat: lat1Num, lon: lon1Num, label: params.get('lbl1') || 'Point A' },
            b: { lat: lat2Num, lon: lon2Num, label: params.get('lbl2') || 'Point B' },
          };
        }
      }
    }
  } catch {
    // fallback
  }
  return {
    a: { lat: 37.7749, lon: -122.4194, label: 'Point A (San Francisco)' },
    b: { lat: 40.7128, lon: -74.006, label: 'Point B (New York City)' },
  };
}

export const GeoDistanceView: React.FC = () => {
  const initialPoints = useMemo(() => getInitialGeoState(), []);
  // Point A and Point B states
  const [pointA, setPointA] = useState<GeoPoint>(initialPoints.a);
  const [pointB, setPointB] = useState<GeoPoint>(initialPoints.b);

  // Quick single-box parser input
  const [quickInput, setQuickInput] = useState<string>('');
  const [quickInputError, setQuickInputError] = useState<string | null>(null);

  // Active top-level mode
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'geofence' | 'code'>('single');

  // Geofence radius state (in meters)
  const [geofenceRadius, setGeofenceRadius] = useState<number>(5000);

  // Copied states
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Selected Code Snippet language
  const [codeLang, setCodeLang] = useState<'ts' | 'python' | 'sql' | 'csharp'>('ts');

  // Batch comparison mode state
  const [batchText, setBatchText] = useState<string>(
    `37.7749, -122.4194, 40.7128, -74.0060, San Francisco to New York\n` +
    `51.5074, -0.1278, 48.8566, 2.3522, London to Paris\n` +
    `35.6762, 139.6503, -33.8688, 151.2093, Tokyo to Sydney\n` +
    `19.0760, 72.8777, 12.9716, 77.5946, Mumbai to Bengaluru`
  );

  // Compute full geodesy metrics for Point A and Point B
  const geodesic = useMemo(() => {
    return computeFullGeodesic(pointA, pointB);
  }, [pointA, pointB]);

  // Geofence check
  const geofence = useMemo(() => {
    return checkGeofence(pointA, pointB, geofenceRadius);
  }, [pointA, pointB, geofenceRadius]);

  // Parse batch items
  const batchItems = useMemo<BatchPairItem[]>(() => {
    const lines = batchText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const results: BatchPairItem[] = [];

    lines.forEach((line, index) => {
      // format: lat1, lon1, lat2, lon2, [optional label]
      const parts = line.split(/[,;\t]+/).map(p => p.trim());
      if (parts.length >= 4) {
        const lat1 = parseFloat(parts[0]);
        const lon1 = parseFloat(parts[1]);
        const lat2 = parseFloat(parts[2]);
        const lon2 = parseFloat(parts[3]);
        const label = parts[4] || `Leg #${index + 1}`;

        if (!isNaN(lat1) && !isNaN(lon1) && !isNaN(lat2) && !isNaN(lon2)) {
          const p1 = { lat: lat1, lon: lon1 };
          const p2 = { lat: lat2, lon: lon2 };
          const distKm = calculateHaversineKm(p1, p2);
          const bearing = calculateBearing(p1, p2);

          results.push({
            id: `batch-${index}`,
            pointA: p1,
            pointB: p2,
            label,
            distanceKm: distKm,
            distanceMiles: distKm * 0.62137119,
            initialBearing: bearing.initialBearingDeg,
            cardinal: bearing.cardinalInitial,
          });
        }
      }
    });

    return results;
  }, [batchText]);

  // Batch statistics
  const batchStats = useMemo(() => {
    if (batchItems.length === 0) return null;
    const totalKm = batchItems.reduce((acc, curr) => acc + curr.distanceKm, 0);
    const avgKm = totalKm / batchItems.length;
    let shortest = batchItems[0];
    let longest = batchItems[0];

    batchItems.forEach(item => {
      if (item.distanceKm < shortest.distanceKm) shortest = item;
      if (item.distanceKm > longest.distanceKm) longest = item;
    });

    return {
      count: batchItems.length,
      totalKm,
      totalMiles: totalKm * 0.62137119,
      avgKm,
      avgMiles: avgKm * 0.62137119,
      shortest,
      longest,
    };
  }, [batchItems]);

  // Swap Points A and B
  const handleSwap = () => {
    const prevA = { ...pointA };
    const prevB = { ...pointB };
    setPointA({ ...prevB, label: prevA.label });
    setPointB({ ...prevA, label: prevB.label });
  };

  // Quick parser submit
  const handleQuickParse = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickInputError(null);
    if (!quickInput.trim()) return;

    // Check dual coordinates first (e.g. "lat1, lon1 to lat2, lon2")
    const dual = parseDualCoordinates(quickInput);
    if (dual) {
      setPointA({ ...dual.p1, label: pointA.label });
      setPointB({ ...dual.p2, label: pointB.label });
      setQuickInput('');
      return;
    }

    // Try single coordinate for Point B (or Point A)
    const single = parseCoordinateInput(quickInput);
    if (single) {
      setPointB({ ...single, label: pointB.label });
      setQuickInput('');
      return;
    }

    setQuickInputError('Could not recognize format. Try e.g. "37.7749, -122.4194" or "37° 46\' N, 122° 25\' W"');
  };

  // Get User's current location via HTML5 Geolocation API
  const handleUseCurrentLocation = (target: 'A' | 'B') => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lon = Number(pos.coords.longitude.toFixed(6));
        if (target === 'A') {
          setPointA({ lat, lon, label: 'My Current Location' });
        } else {
          setPointB({ lat, lon, label: 'My Current Location' });
        }
      },
      err => {
        alert(`Failed to retrieve location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Select Preset
  const handleSelectPreset = (presetId: string) => {
    const p = GEO_PRESETS.find(item => item.id === presetId);
    if (p) {
      setPointA(p.p1);
      setPointB(p.p2);
    }
  };

  // Copy helper
  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Generate shareable permalink
  const getShareableUrl = () => {
    const base = window.location.origin + window.location.pathname;
    return `${base}#/distance?lat1=${pointA.lat}&lon1=${pointA.lon}&lat2=${pointB.lat}&lon2=${pointB.lon}&lbl1=${encodeURIComponent(pointA.label || '')}&lbl2=${encodeURIComponent(pointB.label || '')}`;
  };

  const handleMapPointChange = useCallback((target: 'A' | 'B', lat: number, lon: number) => {
    if (target === 'A') setPointA(prev => ({ ...prev, lat, lon }));
    else setPointB(prev => ({ ...prev, lat, lon }));
  }, []);

  // Export Batch to CSV
  const handleExportCsv = () => {
    let csv = 'Label,PointA_Lat,PointA_Lon,PointB_Lat,PointB_Lon,Distance_KM,Distance_Miles,InitialBearing_Deg,Cardinal\n';
    batchItems.forEach(item => {
      csv += `"${item.label || ''}",${item.pointA.lat},${item.pointA.lon},${item.pointB.lat},${item.pointB.lon},${item.distanceKm.toFixed(3)},${item.distanceMiles.toFixed(3)},${item.initialBearing.toFixed(1)},"${item.cardinal}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coordinate_distances_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#111612] text-[#e4ebdd] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Title & Intro Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#344435]">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#c8edb6]/15 text-[#c8edb6] border border-[#c8edb6]/30">
                <Compass size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#e4ebdd]">
                  Geo Distance & Coordinate Difference Calculator
                </h1>
                <p className="text-xs sm:text-sm text-[#c3ceba]">
                  Calculate high-precision geodetic distances (Vincenty WGS-84 & Haversine), North/South and East/West coordinate deltas, initial bearings, and travel times.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopy(getShareableUrl(), 'share_link')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#171d19] hover:bg-[#344435] border border-[#344435] text-[#e4ebdd] transition-colors"
              title="Copy shareable URL link"
            >
              {copiedKey === 'share_link' ? <Check size={14} className="text-[#b5dfa3]" /> : <Share2 size={14} />}
              <span>{copiedKey === 'share_link' ? 'Copied Link!' : 'Share URL'}</span>
            </button>

            <button
              type="button"
              onClick={handleSwap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#c8edb6]/10 hover:bg-[#c8edb6]/20 border border-[#c8edb6]/30 text-[#c8edb6] transition-colors"
              title="Swap Point A and Point B"
            >
              <ArrowRightLeft size={14} />
              <span>Swap A ⇄ B</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#344435] pb-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'single'
                ? 'bg-[#c8edb6] text-[#0d120f] font-semibold'
                : 'text-[#c3ceba] hover:bg-[#171d19] hover:text-[#e4ebdd]'
            }`}
          >
            <Compass size={14} />
            <span>Dual Coordinate Explorer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'batch'
                ? 'bg-[#c8edb6] text-[#0d120f] font-semibold'
                : 'text-[#c3ceba] hover:bg-[#171d19] hover:text-[#e4ebdd]'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>Batch Multi-Pair Matrix ({batchItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('geofence')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'geofence'
                ? 'bg-[#c8edb6] text-[#0d120f] font-semibold'
                : 'text-[#c3ceba] hover:bg-[#171d19] hover:text-[#e4ebdd]'
            }`}
          >
            <ShieldCheck size={14} />
            <span>Geofence Proximity Tester</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'code'
                ? 'bg-[#c8edb6] text-[#0d120f] font-semibold'
                : 'text-[#c3ceba] hover:bg-[#171d19] hover:text-[#e4ebdd]'
            }`}
          >
            <Code size={14} />
            <span>Developer Code Snippets</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: DUAL COORDINATE EXPLORER */}
        {/* ========================================================================= */}
        {activeTab === 'single' && (
          <div className="space-y-6">
            {/* Quick Parser Bar & Benchmark Presets */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Universal Parser Input */}
              <div className="lg:col-span-8 p-3 rounded-xl bg-[#171d19] border border-[#344435] shadow-sm">
                <form onSubmit={handleQuickParse} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#c3ceba] flex items-center gap-1">
                      <Sparkles size={12} className="text-[#c8edb6]" />
                      <span>Universal Paste & Auto-Parser</span>
                    </label>
                    <span className="text-[10px] text-[#9eac96]">
                      Accepts DD, DMS, GeoJSON, or &quot;lat1, lon1 to lat2, lon2&quot;
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickInput}
                      onChange={e => setQuickInput(e.target.value)}
                      placeholder='e.g. "37.7749, -122.4194 to 40.7128, -74.0060" or "51° 30&apos; N, 0° 7&apos; W"'
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#0d120f] border border-[#344435] focus:border-[#c8edb6] text-xs font-mono text-[#e4ebdd] placeholder-[#9eac96] outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#c8edb6] hover:bg-[#74c7ec] text-[#0d120f] transition-colors"
                    >
                      Parse Coordinates
                    </button>
                  </div>
                  {quickInputError && (
                    <div className="text-[11px] text-[#f19aa6] flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{quickInputError}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Benchmark Presets Selector */}
              <div className="lg:col-span-4 p-3 rounded-xl bg-[#171d19] border border-[#344435] shadow-sm flex flex-col justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#c3ceba]">
                  Benchmark Routes & Tests
                </label>
                <select
                  onChange={e => handleSelectPreset(e.target.value)}
                  defaultValue=""
                  className="w-full mt-2 px-2.5 py-1.5 rounded-lg bg-[#0d120f] border border-[#344435] text-xs text-[#e4ebdd] outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    Choose a preset coordinate pair…
                  </option>
                  {GEO_PRESETS.map(preset => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} (~{preset.expectedKm.toLocaleString()} km)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Point A and Point B Input Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Point A Card */}
              <div className="p-4 rounded-xl bg-[#171d19] border border-[#344435] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#b5dfa3]"></div>
                    <span className="font-semibold text-sm text-[#e4ebdd]">Origin (Point A)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('A')}
                    className="inline-flex items-center gap-1 text-[11px] text-[#c8edb6] hover:underline"
                  >
                    <Crosshair size={12} />
                    <span>My GPS Location</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#c3ceba] mb-1">Latitude (°N / °S)</label>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={pointA.lat}
                      onChange={e => setPointA({ ...pointA, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0d120f] border border-[#344435] focus:border-[#b5dfa3] text-xs font-mono text-[#e4ebdd] outline-none"
                    />
                    <span className="text-[10px] text-[#b1bea8] mt-0.5 block">
                      {toDmsString(pointA.lat, pointA.lat >= 0 ? 'N' : 'S')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#c3ceba] mb-1">Longitude (°E / °W)</label>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={pointA.lon}
                      onChange={e => setPointA({ ...pointA, lon: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0d120f] border border-[#344435] focus:border-[#b5dfa3] text-xs font-mono text-[#e4ebdd] outline-none"
                    />
                    <span className="text-[10px] text-[#b1bea8] mt-0.5 block">
                      {toDmsString(pointA.lon, pointA.lon >= 0 ? 'E' : 'W')}
                    </span>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={pointA.label || ''}
                    onChange={e => setPointA({ ...pointA, label: e.target.value })}
                    placeholder="Location Label (e.g. San Francisco)"
                    className="w-full px-3 py-1 rounded bg-[#0d120f] border border-[#344435] text-[11px] text-[#e4ebdd] placeholder-[#9eac96] outline-none"
                  />
                </div>
              </div>

              {/* Point B Card */}
              <div className="p-4 rounded-xl bg-[#171d19] border border-[#344435] space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#f19aa6]"></div>
                    <span className="font-semibold text-sm text-[#e4ebdd]">Destination (Point B)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUseCurrentLocation('B')}
                    className="inline-flex items-center gap-1 text-[11px] text-[#c8edb6] hover:underline"
                  >
                    <Crosshair size={12} />
                    <span>My GPS Location</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-[#c3ceba] mb-1">Latitude (°N / °S)</label>
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      value={pointB.lat}
                      onChange={e => setPointB({ ...pointB, lat: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0d120f] border border-[#344435] focus:border-[#f19aa6] text-xs font-mono text-[#e4ebdd] outline-none"
                    />
                    <span className="text-[10px] text-[#b1bea8] mt-0.5 block">
                      {toDmsString(pointB.lat, pointB.lat >= 0 ? 'N' : 'S')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#c3ceba] mb-1">Longitude (°E / °W)</label>
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      value={pointB.lon}
                      onChange={e => setPointB({ ...pointB, lon: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0d120f] border border-[#344435] focus:border-[#f19aa6] text-xs font-mono text-[#e4ebdd] outline-none"
                    />
                    <span className="text-[10px] text-[#b1bea8] mt-0.5 block">
                      {toDmsString(pointB.lon, pointB.lon >= 0 ? 'E' : 'W')}
                    </span>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={pointB.label || ''}
                    onChange={e => setPointB({ ...pointB, label: e.target.value })}
                    placeholder="Location Label (e.g. New York City)"
                    className="w-full px-3 py-1 rounded bg-[#0d120f] border border-[#344435] text-[11px] text-[#e4ebdd] placeholder-[#9eac96] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* INTERACTIVE VISUAL CANVAS */}
            <div className="space-y-2">
              <GeoMapCanvas
                pointA={pointA}
                pointB={pointB}
                result={geodesic}
                onPointChange={handleMapPointChange}
              />
            </div>

            {/* PRIMARY DISTANCE HERO CARD */}
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#171d19] via-[#171d19] to-[#243025] border border-[#344435] shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Left: Main Distance Big Numbers */}
                <div className="lg:col-span-5 space-y-2">
                  <div className="text-xs uppercase tracking-wider font-semibold text-[#c8edb6] flex items-center gap-1.5">
                    <Ruler size={14} />
                    <span>Calculated Geodetic Distance</span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-mono text-[#e4ebdd] tracking-tight">
                      {geodesic.haversine.km.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 3,
                      })}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-[#c8edb6]">km</span>
                  </div>

                  <div className="flex items-baseline gap-2 text-[#c3ceba]">
                    <span className="text-xl sm:text-2xl font-semibold font-mono text-[#ceb8f6]">
                      {geodesic.haversine.miles.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 3,
                      })}
                    </span>
                    <span className="text-sm font-medium text-[#ceb8f6]">miles</span>
                    <span className="text-xs text-[#9eac96]">
                      ({geodesic.haversine.nauticalMiles.toLocaleString(undefined, { maximumFractionDigits: 2 })} NM)
                    </span>
                  </div>

                  <div className="text-[11px] text-[#c3ceba] pt-1">
                    Route:{' '}
                    <span className="font-semibold text-[#b5dfa3]">
                      {pointA.label || `${pointA.lat.toFixed(4)}°, ${pointA.lon.toFixed(4)}°`}
                    </span>{' '}
                    ➔{' '}
                    <span className="font-semibold text-[#f19aa6]">
                      {pointB.label || `${pointB.lat.toFixed(4)}°, ${pointB.lon.toFixed(4)}°`}
                    </span>
                  </div>
                </div>

                {/* Right: Geodesic Model Comparison Table */}
                <div className="lg:col-span-7 bg-[#0d120f]/80 rounded-xl p-3.5 border border-[#344435] space-y-2.5">
                  <div className="text-[11px] font-semibold text-[#c3ceba] flex items-center justify-between">
                    <span>Geodetic Formula Comparison</span>
                    <span className="text-[10px] text-[#9eac96]">Earth R = 6,371.009 km</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    {/* Vincenty WGS-84 */}
                    <div className="p-2 rounded-lg bg-[#111612] border border-[#344435]">
                      <div className="text-[10px] text-[#94e2d5] font-semibold">Vincenty (WGS-84)</div>
                      <div className="font-mono font-bold text-[#e4ebdd] mt-0.5">
                        {geodesic.vincenty !== null
                          ? `${geodesic.vincenty.km.toFixed(2)} km`
                          : 'Antipodal (N/A)'}
                      </div>
                      <div className="text-[9px] text-[#9eac96]">Ellipsoid Precision</div>
                    </div>

                    {/* Haversine */}
                    <div className="p-2 rounded-lg bg-[#111612] border border-[#c8edb6]/40">
                      <div className="text-[10px] text-[#c8edb6] font-semibold">Haversine</div>
                      <div className="font-mono font-bold text-[#e4ebdd] mt-0.5">
                        {geodesic.haversine.km.toFixed(2)} km
                      </div>
                      <div className="text-[9px] text-[#c8edb6]">Spherical Arc</div>
                    </div>

                    {/* Law of Cosines */}
                    <div className="p-2 rounded-lg bg-[#111612] border border-[#344435]">
                      <div className="text-[10px] text-[#ceb8f6] font-semibold">Spherical Cosines</div>
                      <div className="font-mono font-bold text-[#e4ebdd] mt-0.5">
                        {geodesic.lawOfCosines.km.toFixed(2)} km
                      </div>
                      <div className="text-[9px] text-[#9eac96]">Trigonometric</div>
                    </div>

                    {/* Flat Earth */}
                    <div className="p-2 rounded-lg bg-[#111612] border border-[#344435]">
                      <div className="text-[10px] text-[#f3c18e] font-semibold">Flat-Earth Approx</div>
                      <div className="font-mono font-bold text-[#e4ebdd] mt-0.5">
                        {geodesic.flatEarth.km.toFixed(2)} km
                      </div>
                      <div className="text-[9px] text-[#9eac96]">Equirectangular</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#c3ceba] pt-1 border-t border-[#344435]/60">
                    <span className="flex items-center gap-1">
                      <span>Straight 3D Chord (Tunnel piercing Earth):</span>
                      <strong className="font-mono text-[#e4ebdd]">
                        {geodesic.tunnelChordDistKm.toFixed(2)} km
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `Distance: ${geodesic.haversine.km.toFixed(3)} km (${geodesic.haversine.miles.toFixed(3)} mi) | Bearing: ${geodesic.bearing.initialBearingDeg.toFixed(1)}°`,
                          'dist_text'
                        )
                      }
                      className="text-[10px] text-[#c8edb6] hover:underline flex items-center gap-1"
                    >
                      {copiedKey === 'dist_text' ? <Check size={11} /> : <Copy size={11} />}
                      <span>{copiedKey === 'dist_text' ? 'Copied' : 'Copy Result'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* COORDINATE DIFFERENCE BREAKDOWN ("distance diff in both pair of cordinates how far is these 2") */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#e4ebdd] flex items-center gap-2">
                  <ArrowRightLeft size={16} className="text-[#f3c18e]" />
                  <span>Coordinate Difference Breakdown (ΔLat & ΔLon Components)</span>
                </h2>
                <span className="text-xs text-[#c3ceba]">
                  How far apart Point A and Point B are along each geographical axis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Delta Latitude (North-South Delta) */}
                <div className="p-4 rounded-xl bg-[#171d19] border border-[#f3c18e]/30 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-semibold text-[#f3c18e]">
                      Δ Latitude (North-South)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#f3c18e]/15 text-[#f3c18e]">
                      {geodesic.delta.latDirection}
                    </span>
                  </div>

                  <div className="font-mono text-2xl font-bold text-[#e4ebdd]">
                    {Math.abs(geodesic.delta.deltaLatDeg).toFixed(5)}°
                  </div>

                  <div className="text-xs text-[#c3ceba] space-y-0.5">
                    <div>
                      Surface distance:{' '}
                      <strong className="text-[#f3c18e] font-mono">
                        {geodesic.delta.distLatKm.toFixed(2)} km
                      </strong>{' '}
                      ({(geodesic.delta.distLatKm * 0.621371).toFixed(2)} mi)
                    </div>
                    <div className="text-[10px] text-[#9eac96] font-mono">
                      DMS: {geodesic.delta.dmsDeltaLat}
                    </div>
                  </div>
                </div>

                {/* 2. Delta Longitude (East-West Delta) */}
                <div className="p-4 rounded-xl bg-[#171d19] border border-[#c8edb6]/30 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-semibold text-[#c8edb6]">
                      Δ Longitude (East-West)
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#c8edb6]/15 text-[#c8edb6]">
                      {geodesic.delta.lonDirection}
                    </span>
                  </div>

                  <div className="font-mono text-2xl font-bold text-[#e4ebdd]">
                    {Math.abs(geodesic.delta.deltaLonDeg).toFixed(5)}°
                  </div>

                  <div className="text-xs text-[#c3ceba] space-y-0.5">
                    <div>
                      Surface distance:{' '}
                      <strong className="text-[#c8edb6] font-mono">
                        {geodesic.delta.distLonKm.toFixed(2)} km
                      </strong>{' '}
                      ({(geodesic.delta.distLonKm * 0.621371).toFixed(2)} mi)
                    </div>
                    <div className="text-[10px] text-[#9eac96] font-mono">
                      DMS: {geodesic.delta.dmsDeltaLon}
                    </div>
                  </div>
                </div>

                {/* 3. Initial Bearing & Direction */}
                <div className="p-4 rounded-xl bg-[#171d19] border border-[#b5dfa3]/30 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-semibold text-[#b5dfa3]">
                      Initial Bearing / Azimuth
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#b5dfa3]/15 text-[#b5dfa3]">
                      {geodesic.bearing.cardinalInitial}
                    </span>
                  </div>

                  <div className="font-mono text-2xl font-bold text-[#e4ebdd]">
                    {geodesic.bearing.initialBearingDeg.toFixed(2)}°
                  </div>

                  <div className="text-xs text-[#c3ceba] space-y-0.5">
                    <div>
                      Final heading at B:{' '}
                      <strong className="text-[#e4ebdd] font-mono">
                        {geodesic.bearing.finalBearingDeg.toFixed(1)}°
                      </strong>
                    </div>
                    <div className="text-[10px] text-[#9eac96]">
                      Reverse heading (B ➔ A): {geodesic.bearing.reverseBearingDeg.toFixed(1)}° ({geodesic.bearing.cardinalReverse})
                    </div>
                  </div>
                </div>

                {/* 4. Manhattan & Midpoint */}
                <div className="p-4 rounded-xl bg-[#171d19] border border-[#ceb8f6]/30 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase font-semibold text-[#ceb8f6]">
                      Manhattan (L1 Grid) Distance
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#ceb8f6]/15 text-[#ceb8f6]">
                      ΔLat + ΔLon
                    </span>
                  </div>

                  <div className="font-mono text-2xl font-bold text-[#e4ebdd]">
                    {geodesic.delta.manhattanDistKm.toFixed(2)} km
                  </div>

                  <div className="text-xs text-[#c3ceba] space-y-0.5">
                    <div>
                      Great-Circle Midpoint:{' '}
                      <strong className="text-[#94e2d5] font-mono">
                        {geodesic.midpoint.lat.toFixed(3)}°, {geodesic.midpoint.lon.toFixed(3)}°
                      </strong>
                    </div>
                    <div className="text-[10px] text-[#9eac96]">
                      Ratio (Grid / Direct):{' '}
                      {(geodesic.delta.manhattanDistKm / (geodesic.haversine.km || 1)).toFixed(2)}x
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ALL UNIT CONVERSIONS & TRAVEL TIME ESTIMATES */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Unit Conversions Grid */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-[#171d19] border border-[#344435] space-y-3">
                <div className="flex items-center justify-between border-b border-[#344435] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e4ebdd] flex items-center gap-1.5">
                    <Layers size={14} className="text-[#c8edb6]" />
                    <span>Unit Conversions Matrix</span>
                  </span>
                  <span className="text-[10px] text-[#9eac96]">Equivalent Measurements</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <span className="text-[10px] text-[#c3ceba] uppercase">Kilometers</span>
                    <div className="font-mono font-bold text-sm text-[#e4ebdd] mt-0.5">
                      {geodesic.haversine.km.toLocaleString(undefined, { maximumFractionDigits: 3 })} km
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <span className="text-[10px] text-[#c3ceba] uppercase">Meters</span>
                    <div className="font-mono font-bold text-sm text-[#e4ebdd] mt-0.5">
                      {geodesic.haversine.meters.toLocaleString(undefined, { maximumFractionDigits: 1 })} m
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <span className="text-[10px] text-[#c3ceba] uppercase">Statute Miles</span>
                    <div className="font-mono font-bold text-sm text-[#ceb8f6] mt-0.5">
                      {geodesic.haversine.miles.toLocaleString(undefined, { maximumFractionDigits: 3 })} mi
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <span className="text-[10px] text-[#c3ceba] uppercase">Nautical Miles</span>
                    <div className="font-mono font-bold text-sm text-[#c8edb6] mt-0.5">
                      {geodesic.haversine.nauticalMiles.toLocaleString(undefined, { maximumFractionDigits: 3 })} NM
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <span className="text-[10px] text-[#c3ceba] uppercase">Feet</span>
                    <div className="font-mono font-bold text-sm text-[#e4ebdd] mt-0.5">
                      {geodesic.haversine.feet.toLocaleString(undefined, { maximumFractionDigits: 0 })} ft
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <span className="text-[10px] text-[#c3ceba] uppercase">Yards</span>
                    <div className="font-mono font-bold text-sm text-[#e4ebdd] mt-0.5">
                      {geodesic.haversine.yards.toLocaleString(undefined, { maximumFractionDigits: 0 })} yd
                    </div>
                  </div>
                </div>
              </div>

              {/* Travel Time Estimates */}
              <div className="lg:col-span-6 p-4 rounded-xl bg-[#171d19] border border-[#344435] space-y-3">
                <div className="flex items-center justify-between border-b border-[#344435] pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e4ebdd] flex items-center gap-1.5">
                    <Clock size={14} className="text-[#f3d58c]" />
                    <span>Travel Time Estimates</span>
                  </span>
                  <span className="text-[10px] text-[#9eac96]">Ideal Straight Route Speeds</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <div className="text-[10px] text-[#c3ceba]">Walking (5 km/h)</div>
                    <div className="font-mono font-bold text-sm text-[#e4ebdd] mt-0.5">
                      {formatHours(geodesic.travelTimes.walkingHours)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <div className="text-[10px] text-[#c3ceba]">Bicycle (20 km/h)</div>
                    <div className="font-mono font-bold text-sm text-[#e4ebdd] mt-0.5">
                      {formatHours(geodesic.travelTimes.cyclingHours)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <div className="text-[10px] text-[#c3ceba]">Driving (85 km/h)</div>
                    <div className="font-mono font-bold text-sm text-[#f3c18e] mt-0.5">
                      {formatHours(geodesic.travelTimes.drivingHours)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <div className="text-[10px] text-[#c3ceba]">High-Speed Rail (250 km/h)</div>
                    <div className="font-mono font-bold text-sm text-[#c8edb6] mt-0.5">
                      {formatHours(geodesic.travelTimes.highSpeedRailHours)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <div className="text-[10px] text-[#c3ceba]">Jet Flight (850 km/h)</div>
                    <div className="font-mono font-bold text-sm text-[#b5dfa3] mt-0.5">
                      {formatHours(geodesic.travelTimes.flightHours)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435]">
                    <div className="text-[10px] text-[#c3ceba]">Speed of Light (Vacuum)</div>
                    <div className="font-mono font-bold text-sm text-[#94e2d5] mt-0.5">
                      {geodesic.travelTimes.lightLatencyMs.toFixed(2)} ms
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: BATCH MULTI-PAIR MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'batch' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Batch Input Textarea */}
              <div className="lg:col-span-5 p-4 rounded-xl bg-[#171d19] border border-[#344435] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e4ebdd] flex items-center gap-1.5">
                    <ListPlus size={14} className="text-[#c8edb6]" />
                    <span>Paste Coordinate Pairs (CSV or Lines)</span>
                  </span>
                  <span className="text-[10px] text-[#9eac96]">1 pair per line</span>
                </div>

                <div className="text-[11px] text-[#c3ceba]">
                  Format: <code className="bg-[#0d120f] px-1 py-0.5 rounded text-[#c8edb6]">lat1, lon1, lat2, lon2, [Label]</code>
                </div>

                <textarea
                  rows={9}
                  value={batchText}
                  onChange={e => setBatchText(e.target.value)}
                  className="w-full p-3 rounded-lg bg-[#0d120f] border border-[#344435] focus:border-[#c8edb6] font-mono text-xs text-[#e4ebdd] outline-none resize-none leading-relaxed"
                  placeholder="37.7749, -122.4194, 40.7128, -74.0060, SF to NYC"
                />

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setBatchText(
                        `37.7749, -122.4194, 40.7128, -74.0060, SF to NYC\n51.5074, -0.1278, 48.8566, 2.3522, London to Paris\n35.6762, 139.6503, -33.8688, 151.2093, Tokyo to Sydney`
                      )
                    }
                    className="text-xs text-[#c8edb6] hover:underline"
                  >
                    Load Sample Fleet List
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c8edb6] hover:bg-[#74c7ec] text-[#0d120f] transition-colors"
                  >
                    <Download size={13} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Batch Summary Stats */}
              <div className="lg:col-span-7 space-y-4">
                {batchStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#171d19] border border-[#344435]">
                      <span className="text-[10px] uppercase text-[#c3ceba]">Total Legs</span>
                      <div className="font-mono text-2xl font-bold text-[#e4ebdd] mt-0.5">
                        {batchStats.count}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#171d19] border border-[#344435]">
                      <span className="text-[10px] uppercase text-[#c3ceba]">Total Distance</span>
                      <div className="font-mono text-xl font-bold text-[#c8edb6] mt-0.5">
                        {batchStats.totalKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
                      </div>
                      <div className="text-[10px] text-[#9eac96]">
                        {batchStats.totalMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#171d19] border border-[#344435]">
                      <span className="text-[10px] uppercase text-[#c3ceba]">Average Leg</span>
                      <div className="font-mono text-xl font-bold text-[#ceb8f6] mt-0.5">
                        {batchStats.avgKm.toLocaleString(undefined, { maximumFractionDigits: 1 })} km
                      </div>
                      <div className="text-[10px] text-[#9eac96]">
                        {batchStats.avgMiles.toLocaleString(undefined, { maximumFractionDigits: 1 })} mi
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#171d19] border border-[#344435]">
                      <span className="text-[10px] uppercase text-[#c3ceba]">Longest Leg</span>
                      <div className="font-mono text-base font-bold text-[#f19aa6] mt-0.5 truncate">
                        {batchStats.longest.distanceKm.toFixed(0)} km
                      </div>
                      <div className="text-[10px] text-[#c3ceba] truncate">
                        {batchStats.longest.label}
                      </div>
                    </div>
                  </div>
                )}

                {/* Batch Table */}
                <div className="rounded-xl border border-[#344435] bg-[#171d19] overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[360px]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-[#0d120f] text-[#c3ceba] sticky top-0 border-b border-[#344435]">
                        <tr>
                          <th className="py-2.5 px-3">#</th>
                          <th className="py-2.5 px-3">Route Label</th>
                          <th className="py-2.5 px-3">Point A (Lat, Lon)</th>
                          <th className="py-2.5 px-3">Point B (Lat, Lon)</th>
                          <th className="py-2.5 px-3 text-right">Distance (KM)</th>
                          <th className="py-2.5 px-3 text-right">Miles</th>
                          <th className="py-2.5 px-3 text-center">Heading</th>
                          <th className="py-2.5 px-3 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#344435]/60">
                        {batchItems.map((item, idx) => (
                          <tr key={item.id} className="hover:bg-[#243025]/50 transition-colors">
                            <td className="py-2 px-3 text-[#9eac96] font-mono">{idx + 1}</td>
                            <td className="py-2 px-3 font-medium text-[#e4ebdd]">{item.label}</td>
                            <td className="py-2 px-3 font-mono text-[#b5dfa3]">
                              {item.pointA.lat.toFixed(4)}, {item.pointA.lon.toFixed(4)}
                            </td>
                            <td className="py-2 px-3 font-mono text-[#f19aa6]">
                              {item.pointB.lat.toFixed(4)}, {item.pointB.lon.toFixed(4)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-[#c8edb6]">
                              {item.distanceKm.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-[#ceb8f6]">
                              {item.distanceMiles.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-[#f3c18e]">
                              {item.initialBearing.toFixed(0)}° ({item.cardinal})
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setPointA({ ...item.pointA, label: `${item.label} (A)` });
                                  setPointB({ ...item.pointB, label: `${item.label} (B)` });
                                  setActiveTab('single');
                                }}
                                className="px-2 py-0.5 rounded bg-[#344435] hover:bg-[#c8edb6] hover:text-[#0d120f] text-[10px] font-semibold text-[#e4ebdd] transition-colors"
                              >
                                Load in Map
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: GEOFENCE PROXIMITY TESTER */}
        {/* ========================================================================= */}
        {activeTab === 'geofence' && (
          <div className="space-y-6">
            <div className="p-5 sm:p-6 rounded-2xl bg-[#171d19] border border-[#344435] space-y-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#344435] pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#e4ebdd] flex items-center gap-2">
                    <ShieldCheck size={18} className="text-[#c8edb6]" />
                    <span>Geofence Boundary & Proximity Alert Checker</span>
                  </h3>
                  <p className="text-xs text-[#c3ceba]">
                    Evaluate whether Point B (Vehicle / Asset / User) is within a circular radius centered at Point A.
                  </p>
                </div>

                {/* Inside vs Outside Status Badge */}
                <div>
                  {geofence.isInside ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#b5dfa3]/15 border border-[#b5dfa3]/40 text-[#b5dfa3] font-bold text-sm">
                      <ShieldCheck size={18} />
                      <span>INSIDE GEOFENCE BOUNDARY</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f19aa6]/15 border border-[#f19aa6]/40 text-[#f19aa6] font-bold text-sm">
                      <ShieldAlert size={18} />
                      <span>OUTSIDE GEOFENCE BOUNDARY</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Radius Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="space-y-1">
                  <label className="text-xs text-[#c3ceba] font-medium">Center Location (Point A)</label>
                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435] text-xs font-mono text-[#b5dfa3]">
                    {pointA.lat.toFixed(5)}°, {pointA.lon.toFixed(5)}° ({pointA.label || 'Origin'})
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-[#c3ceba] font-medium">Target Location (Point B)</label>
                  <div className="p-2.5 rounded-lg bg-[#0d120f] border border-[#344435] text-xs font-mono text-[#f19aa6]">
                    {pointB.lat.toFixed(5)}°, {pointB.lon.toFixed(5)}° ({pointB.label || 'Target'})
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-[#c3ceba] font-medium">
                    <span>Geofence Radius (Meters)</span>
                    <span className="text-[#c8edb6] font-mono font-bold">
                      {(geofenceRadius / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <input
                    type="number"
                    min="10"
                    step="50"
                    value={geofenceRadius}
                    onChange={e => setGeofenceRadius(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0d120f] border border-[#344435] focus:border-[#c8edb6] text-xs font-mono text-[#e4ebdd] outline-none"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[#c3ceba] text-[11px]">Radius Quick Presets:</span>
                {[100, 500, 1000, 5000, 25000, 50000].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setGeofenceRadius(m)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors border ${
                      geofenceRadius === m
                        ? 'bg-[#c8edb6] text-[#0d120f] border-[#c8edb6] font-bold'
                        : 'bg-[#111612] border-[#344435] text-[#c3ceba] hover:text-[#e4ebdd]'
                    }`}
                  >
                    {m >= 1000 ? `${m / 1000} km` : `${m} m`}
                  </button>
                ))}
              </div>

              {/* Geofence Metrics Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#0d120f] border border-[#344435]">
                  <span className="text-[10px] text-[#c3ceba] uppercase">Target Distance to Center</span>
                  <div className="font-mono text-xl font-bold text-[#e4ebdd] mt-1">
                    {geofence.distanceToCenterMeters >= 1000
                      ? `${(geofence.distanceToCenterMeters / 1000).toFixed(3)} km`
                      : `${geofence.distanceToCenterMeters.toFixed(1)} m`}
                  </div>
                  <div className="text-[10px] text-[#9eac96]">
                    ({(geofence.distanceToCenterMeters * 3.28084).toFixed(0)} ft)
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0d120f] border border-[#344435]">
                  <span className="text-[10px] text-[#c3ceba] uppercase">Configured Radius</span>
                  <div className="font-mono text-xl font-bold text-[#c8edb6] mt-1">
                    {geofence.radiusMeters >= 1000
                      ? `${(geofence.radiusMeters / 1000).toFixed(2)} km`
                      : `${geofence.radiusMeters} m`}
                  </div>
                  <div className="text-[10px] text-[#9eac96]">
                    Perimeter circumference: {(2 * Math.PI * (geofence.radiusMeters / 1000)).toFixed(2)} km
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#0d120f] border border-[#344435]">
                  <span className="text-[10px] text-[#c3ceba] uppercase">
                    {geofence.isInside ? 'Margin to Boundary Edge' : 'Distance Outside Perimeter'}
                  </span>
                  <div
                    className={`font-mono text-xl font-bold mt-1 ${
                      geofence.isInside ? 'text-[#b5dfa3]' : 'text-[#f19aa6]'
                    }`}
                  >
                    {geofence.marginMeters >= 1000
                      ? `${(geofence.marginMeters / 1000).toFixed(3)} km`
                      : `${geofence.marginMeters.toFixed(1)} m`}
                  </div>
                  <div className="text-[10px] text-[#9eac96]">
                    {geofence.isInside ? 'Safe interior clearance' : 'Boundary violation delta'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: DEVELOPER CODE SNIPPETS */}
        {/* ========================================================================= */}
        {activeTab === 'code' && (
          <div className="p-5 rounded-2xl bg-[#171d19] border border-[#344435] space-y-4 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#344435] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#e4ebdd] flex items-center gap-2">
                  <Code size={16} className="text-[#c8edb6]" />
                  <span>Production Haversine & Geodesy Code Snippets</span>
                </h3>
                <p className="text-xs text-[#c3ceba]">
                  Ready-to-copy distance calculation routines for your backend or database
                </p>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1.5 bg-[#0d120f] p-1 rounded-lg border border-[#344435] text-xs">
                {(['ts', 'python', 'sql', 'csharp'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setCodeLang(lang)}
                    className={`px-3 py-1 rounded font-medium transition-colors ${
                      codeLang === lang
                        ? 'bg-[#c8edb6] text-[#0d120f] font-bold'
                        : 'text-[#c3ceba] hover:text-[#e4ebdd]'
                    }`}
                  >
                    {lang === 'ts'
                      ? 'TypeScript'
                      : lang === 'python'
                      ? 'Python'
                      : lang === 'sql'
                      ? 'PostGIS / SQL'
                      : 'C# .NET'}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Display Area */}
            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#0d120f] border border-[#344435] overflow-x-auto text-xs font-mono text-[#e4ebdd] leading-relaxed">
                {codeLang === 'ts' &&
`// TypeScript: Haversine distance in kilometers
function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371.0; // Earth mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Example invocation with current coordinates:
const km = getHaversineDistanceKm(${pointA.lat}, ${pointA.lon}, ${pointB.lat}, ${pointB.lon});
console.log(\`Distance: \${km.toFixed(2)} km\`);`}

                {codeLang === 'python' &&
`import math

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Great-Circle distance between two points in kilometers."""
    R = 6371.0  # Earth's radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = (math.sin(dphi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

# Run calculation:
dist = haversine_distance_km(${pointA.lat}, ${pointA.lon}, ${pointB.lat}, ${pointB.lon})
print(f"Distance: {dist:.2f} km")`}

                {codeLang === 'sql' &&
`-- PostGIS / PostgreSQL (High-precision ellipsoidal geodesic distance in meters):
SELECT ST_Distance(
  ST_SetSRID(ST_MakePoint(${pointA.lon}, ${pointA.lat}), 4326)::geography,
  ST_SetSRID(ST_MakePoint(${pointB.lon}, ${pointB.lat}), 4326)::geography
) / 1000.0 AS distance_km;

-- Pure SQL (Standard Haversine formula without spatial extensions):
SELECT 6371.0 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(${pointB.lat} - ${pointA.lat}) / 2), 2) +
    COS(RADIANS(${pointA.lat})) * COS(RADIANS(${pointB.lat})) *
    POWER(SIN(RADIANS(${pointB.lon} - ${pointA.lon}) / 2), 2)
)) AS haversine_distance_km;`}

                {codeLang === 'csharp' &&
`using System;

public static class GeodesyHelper
{
    private const double EarthRadiusKm = 6371.0;

    public static double CalculateHaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        double dLat = ToRadians(lat2 - lat1);
        double dLon = ToRadians(lon2 - lon1);
        double rLat1 = ToRadians(lat1);
        double rLat2 = ToRadians(lat2);

        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                   Math.Cos(rLat1) * Math.Cos(rLat2) *
                   Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return EarthRadiusKm * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}

// Invocation:
double km = GeodesyHelper.CalculateHaversineKm(${pointA.lat}, ${pointA.lon}, ${pointB.lat}, ${pointB.lon});`}
              </pre>

              <button
                type="button"
                onClick={() => {
                  let text = '';
                  if (codeLang === 'ts') {
                    text = `function getHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {\n  const R = 6371.0;\n  const toRad = (deg: number) => (deg * Math.PI) / 180;\n  const dLat = toRad(lat2 - lat1);\n  const dLon = toRad(lon2 - lon1);\n  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);\n  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));\n}`;
                  } else if (codeLang === 'python') {
                    text = `import math\ndef haversine_distance_km(lat1, lon1, lat2, lon2):\n    R = 6371.0\n    dphi = math.radians(lat2 - lat1)\n    dlam = math.radians(lon2 - lon1)\n    a = math.sin(dphi/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(dlam/2)**2\n    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))`;
                  } else if (codeLang === 'sql') {
                    text = `SELECT ST_Distance(ST_SetSRID(ST_MakePoint(${pointA.lon}, ${pointA.lat}), 4326)::geography, ST_SetSRID(ST_MakePoint(${pointB.lon}, ${pointB.lat}), 4326)::geography) / 1000.0 AS distance_km;`;
                  } else {
                    text = `double CalculateHaversineKm(double lat1, double lon1, double lat2, double lon2) { double R = 6371.0; double dLat = (lat2-lat1)*Math.PI/180; double dLon = (lon2-lon1)*Math.PI/180; double a = Math.Sin(dLat/2)*Math.Sin(dLat/2) + Math.Cos(lat1*Math.PI/180)*Math.Cos(lat2*Math.PI/180)*Math.Sin(dLon/2)*Math.Sin(dLon/2); return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1-a)); }`;
                  }
                  handleCopy(text, 'snippet');
                }}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-[#344435] hover:bg-[#71836b] text-xs font-medium text-[#e4ebdd] transition-colors flex items-center gap-1.5 shadow"
              >
                {copiedKey === 'snippet' ? <Check size={13} className="text-[#b5dfa3]" /> : <Copy size={13} />}
                <span>{copiedKey === 'snippet' ? 'Copied Snippet!' : 'Copy Snippet'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeoDistanceView;
