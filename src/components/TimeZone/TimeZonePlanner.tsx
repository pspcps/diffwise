import { useMemo, useState, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, Home, Plus, X } from "lucide-react";
import { MAJOR_TIME_ZONES } from "../../data/majorTimeZones";
import {
  timelineTime,
  plannerStart,
  offsetDifference,
  shortZoneLabel,
  formatPlannerTime,
} from "../../utils/timeZoneTimeline";
import "./time-zone-planner.css";
const COMMON_CITIES = [
  "Asia/Kolkata",
  "Pacific/Honolulu",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];
export default function TimeZonePlanner({
  instant,
  sourceZone,
  targetZone,
  allZones,
  showAll,
  onSelect,
  onSourceZone,
  onLocalTime,
  hour12 = false,
  onPause,
}: {
  instant: number;
  sourceZone: string;
  targetZone: string;
  allZones: string[];
  showAll: boolean;
  onSelect: (instant: number) => void;
  onSourceZone: (zone: string) => void;
  onLocalTime: (value: string) => void;
  hour12?: boolean;
  onPause?: () => void;
}) {
  const [extras, setExtras] = useState<string[]>(["America/Los_Angeles"]);
  const [candidate, setCandidate] = useState("Pacific/Honolulu");
  const [step, setStep] = useState(60);
  const [hover, setHover] = useState<number | null>(null);
  const [range, setRange] = useState(() => ({
    zone: sourceZone,
    step,
    start: plannerStart(instant, sourceZone, step),
  }));
  if (
    range.zone !== sourceZone ||
    range.step !== step ||
    instant < range.start ||
    instant >= range.start + 24 * step * 60000
  )
    setRange({
      zone: sourceZone,
      step,
      start: plannerStart(instant, sourceZone, step),
    });
  const zones = [...new Set([sourceZone, targetZone, ...extras])].slice(0, 8);
  const zoneKey = JSON.stringify(zones);
  const rows = useMemo(() => {
    const ids = JSON.parse(zoneKey) as string[];
    return ids.map((zone) => ({
      zone,
      cells: Array.from({ length: 24 }, (_, index) =>
        timelineTime(range.start + index * step * 60000, zone),
      ),
    }));
  }, [zoneKey, range.start, step]);
  const index = Math.max(
    0,
    Math.min(23, Math.floor((instant - range.start) / (step * 60000))),
  );
  const baseTime = timelineTime(instant, sourceZone);
  const windowMinutes = step * 24;
  const durationLabel =
    windowMinutes % 60 === 0
      ? `${windowMinutes / 60} hours`
      : `${windowMinutes} minutes`;
  const preview =
    hover === null
      ? null
      : timelineTime(range.start + hover * step * 60000, sourceZone);
  const available = [
    ...new Set([...COMMON_CITIES, ...(showAll ? allZones : [])]),
  ];
  function choose(hour: number) {
    onSelect(range.start + hour * step * 60000);
  }
  function move(event: KeyboardEvent<HTMLButtonElement>, hour: number) {
    const next =
      event.key === "ArrowRight"
        ? Math.min(23, hour + 1)
        : event.key === "ArrowLeft"
          ? Math.max(0, hour - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? 23
              : -1;
    if (next < 0) return;
    event.preventDefault();
    choose(next);
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        "button",
      );
    buttons?.item(next)?.focus();
  }
  function shift(direction: number) {
    setRange({
      zone: sourceZone,
      step,
      start: range.start + direction * 24 * step * 60000,
    });
    onSelect(instant + direction * 24 * step * 60000);
  }
  function makeBase(zone: string) {
    setExtras((previous) => [...new Set([...previous, sourceZone])]);
    onSourceZone(zone);
  }
  return (
    <section className="tz-planner" aria-labelledby="tz-planner-heading">
      <header className="tz-planner-heading">
        <div>
          <h2 id="tz-planner-heading">Find a time that works across zones</h2>
          <p>
            Click a time slot to compare the same moment everywhere. Your
            converter updates above.
          </p>
        </div>
        <div className="tz-planner-range">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label={`Previous ${durationLabel}`}
          >
            <ChevronLeft size={17} />
          </button>
          <span>
            {baseTime.date}
            <small>{shortZoneLabel(sourceZone)} reference</small>
          </span>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label={`Next ${durationLabel}`}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </header>
      <div className="tz-planner-toolbar">
        <label>
          <span>Add location or UTC offset</span>
          <select
            value={candidate}
            onChange={(event) => setCandidate(event.target.value)}
            aria-label="Add time zone to planner"
          >
            <optgroup label="Major cities · daylight saving applied">
              {available.map((zone) => (
                <option key={zone} value={zone}>
                  {shortZoneLabel(zone)} · {zone}
                </option>
              ))}
            </optgroup>
            <optgroup label="Fixed UTC offsets">
              {MAJOR_TIME_ZONES.map((zone) => (
                <option key={zone.id} value={zone.id}>
                  {zone.offsetLabel} · {zone.label}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
        <button
          className="tz-add"
          type="button"
          disabled={zones.includes(candidate) || zones.length >= 8}
          onClick={() => setExtras((previous) => [...previous, candidate])}
        >
          <Plus size={16} />
          Add zone
        </button>
        <label className="tz-planner-step">
          <span>Timeline interval</span>
          <select
            aria-label="Timeline interval"
            value={step}
            onChange={(event) => {
              setStep(Number(event.target.value));
              setHover(null);
            }}
          >
            <option value="60">1 hour</option>
            <option value="30">30 minutes</option>
            <option value="15">15 minutes</option>
            <option value="5">5 minutes</option>
            <option value="1">1 minute</option>
          </select>
        </label>
        <label className="tz-planner-exact">
          <span>Exact reference time</span>
          <input
            type="time"
            step="60"
            aria-label="Exact reference time"
            onFocus={onPause}
            value={baseTime.time}
            onChange={(event) => {
              if (event.target.value)
                onLocalTime(
                  `${baseTime.date}T${event.target.value.length === 5 ? event.target.value + ":00" : event.target.value}`,
                );
            }}
          />
        </label>
        <span className="tz-planner-legend">
          <i data-period="work" />
          09–17
          <i data-period="evening" />
          07–09 / 17–22
          <i data-period="night" />
          22–07
        </span>
      </div>
      <p className="tz-planner-hint">
        Up to 8 zones. Shading is a local-hour guide, not a promise of
        availability. Use the house icon to change the reference zone.
      </p>
      <div className="tz-planner-selection-status">
        <span>
          <i className="tz-selected-key" />
          Selected: <strong>
            {formatPlannerTime(baseTime, hour12)}
          </strong> · {baseTime.date} · {shortZoneLabel(sourceZone)}
        </span>
        {preview && hover !== index && (
          <span>
            <i className="tz-hover-key" />
            Preview: <strong>{formatPlannerTime(preview, hour12)}</strong> ·
            click to select
          </span>
        )}
        <span>{durationLabel} shown</span>
      </div>
      <div className="tz-planner-scroll" onMouseLeave={() => setHover(null)}>
        <div className="tz-planner-table">
          <div className="tz-planner-column-overlays" aria-hidden="true">
            <span
              className="tz-planner-selected-column"
              style={{ gridColumn: index + 1 }}
            />
            {hover !== null && hover !== index && (
              <span
                className="tz-planner-hover-column"
                style={{ gridColumn: hover + 1 }}
              />
            )}
          </div>
          <div className="tz-planner-table-heading">
            <span>Location · selected local time</span>
            <div>
              {Array.from({ length: 24 }, (_, hour) => (
                <span
                  key={hour}
                  className={
                    hour === index
                      ? "is-selected"
                      : hour === hover
                        ? "is-preview"
                        : ""
                  }
                >
                  {hour === index
                    ? "Selected"
                    : hour === hover
                      ? "Preview"
                      : ""}
                </span>
              ))}
            </div>
          </div>
          {rows.map(({ zone, cells }) => {
            const local = timelineTime(instant, zone);
            return (
              <div className="tz-planner-row" key={zone}>
                <div className="tz-planner-label">
                  <div className="tz-planner-row-actions">
                    <button
                      type="button"
                      onClick={() => makeBase(zone)}
                      aria-label={`Use ${shortZoneLabel(zone)} as reference zone`}
                      aria-pressed={zone === sourceZone}
                      title="Use as reference zone"
                    >
                      <Home size={15} />
                    </button>
                    {zone !== sourceZone && zone !== targetZone && (
                      <button
                        type="button"
                        onClick={() =>
                          setExtras((previous) =>
                            previous.filter((item) => item !== zone),
                          )
                        }
                        aria-label={`Remove ${shortZoneLabel(zone)} from planner`}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div>
                    <strong>{shortZoneLabel(zone)}</strong>
                    <span title={zone}>
                      {zone === sourceZone
                        ? "Reference"
                        : offsetDifference(local.offset - baseTime.offset)}{" "}
                      · {zone}
                    </span>
                  </div>
                  <div className="tz-planner-local">
                    <strong>{formatPlannerTime(local, hour12)}</strong>
                    <span>{local.date}</span>
                  </div>
                </div>
                <div
                  className="tz-planner-hours"
                  onMouseLeave={() => setHover(null)}
                >
                  {cells.map((cell, hour) => (
                    <button
                      type="button"
                      key={hour}
                      data-period={cell.period}
                      data-midnight={cell.hour === 0 && cell.minute === 0}
                      className={`${hour === index ? "is-selected" : ""} ${hour === hover ? "is-hovered" : ""}`}
                      aria-pressed={hour === index}
                      tabIndex={hour === index ? 0 : -1}
                      onMouseEnter={() => setHover(hour)}
                      onFocus={() => setHover(hour)}
                      onBlur={() => setHover(null)}
                      onClick={() => choose(hour)}
                      onKeyDown={(event) => move(event, hour)}
                      aria-label={`Select ${cell.date} ${formatPlannerTime(cell, hour12)} in ${zone}, UTC offset ${offsetDifference(cell.offset)}`}
                    >
                      {(hour === 0 || cell.date !== cells[hour - 1].date) && (
                        <span className="tz-planner-day-badge">
                          {cell.date.slice(5)}
                        </span>
                      )}
                      <span>
                        {hour12
                          ? cell.hour % 12 || 12
                          : String(cell.hour).padStart(2, "0")}
                      </span>
                      <small>
                        {String(cell.minute).padStart(2, "0")}
                        {hour12 ? (cell.hour < 12 ? " am" : " pm") : ""}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="tz-planner-hint">
        The grid shows 24 equal time slots at the chosen interval. Date labels
        show local day changes; city rows follow daylight saving, so an hour can
        repeat or be skipped. Left/right arrow keys move between columns.
      </p>
    </section>
  );
}
