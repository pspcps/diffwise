import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { ChevronLeft, ChevronRight, Home, Plus, X } from "lucide-react";
import { MAJOR_TIME_ZONES } from "../../data/majorTimeZones";
import {
  timelineTime,
  plannerStart,
  offsetDifference,
  shortZoneLabel,
  formatPlannerTime,
  plannerSlotCount,
  HOUR_MS,
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
  const slots = plannerSlotCount(step);
  const scroll = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<{ zone: string; slot: number } | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const [viewport, setViewport] = useState({
    left: 0,
    width: 1200,
    labelWidth: 284,
  });
  useEffect(() => {
    const element = scroll.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      setViewport({
        left: element.scrollLeft,
        width: element.clientWidth,
        labelWidth: table.current
          ? parseFloat(
              getComputedStyle(table.current).getPropertyValue(
                "--tz-label-width",
              ),
            ) || 284
          : 284,
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    const resize = new ResizeObserver(schedule);
    resize.observe(element);
    element.addEventListener("scroll", schedule, { passive: true });
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      element.removeEventListener("scroll", schedule);
    };
  }, []);
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
    instant >= range.start + 24 * HOUR_MS
  )
    setRange({
      zone: sourceZone,
      step,
      start: plannerStart(instant, sourceZone, step),
    });
  const zones = [...new Set([sourceZone, targetZone, ...extras])].slice(0, 8);
  const zoneKey = JSON.stringify(zones);
  const firstSlot = Math.max(
    0,
    Math.min(slots - 1, Math.floor(viewport.left / 42) - 6),
  );
  const lastSlot = Math.min(
    slots,
    Math.ceil(
      (viewport.left + Math.max(42, viewport.width - viewport.labelWidth)) / 42,
    ) + 6,
  );
  const visibleSlots = useMemo(
    () =>
      Array.from(
        { length: Math.max(0, lastSlot - firstSlot) },
        (_, index) => firstSlot + index,
      ),
    [firstSlot, lastSlot],
  );
  const rows = useMemo(() => {
    const ids = JSON.parse(zoneKey) as string[];
    return ids.map((zone) => ({
      zone,
      cells: visibleSlots.map((slot) => ({
        slot,
        ...timelineTime(range.start + slot * step * 60000, zone),
      })),
    }));
  }, [zoneKey, range.start, step, visibleSlots]);
  const index = Math.max(
    0,
    Math.min(slots - 1, Math.floor((instant - range.start) / (step * 60000))),
  );
  const baseTime = timelineTime(instant, sourceZone);
  const durationLabel = "24 hours";
  useEffect(() => {
    const element = scroll.current;
    if (!element) return;
    const slot = Math.floor((instant - range.start) / (step * 60000));
    element.scrollLeft = Math.max(
      0,
      slot * 42 - (element.clientWidth - viewport.labelWidth) / 2,
    );
    // Recenter when interval/window changes; ordinary selections retain scroll position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, range.start]);
  useEffect(() => {
    const pending = pendingFocus.current;
    if (!pending) return;
    const button = rowRefs.current
      .get(pending.zone)
      ?.querySelector<HTMLButtonElement>(`[data-slot="${pending.slot}"]`);
    if (button) {
      pendingFocus.current = null;
      button.focus({ preventScroll: true });
    }
  }, [firstSlot, lastSlot, index]);
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
  function move(
    event: KeyboardEvent<HTMLButtonElement>,
    hour: number,
    zone: string,
  ) {
    const next =
      event.key === "ArrowRight"
        ? Math.min(slots - 1, hour + 1)
        : event.key === "ArrowLeft"
          ? Math.max(0, hour - 1)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? slots - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    choose(next);
    const button =
      event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
        `[data-slot="${next}"]`,
      );
    if (button) {
      button.focus();
    } else {
      pendingFocus.current = { zone, slot: next };
      if (scroll.current)
        scroll.current.scrollLeft = Math.max(
          0,
          next * 42 - (scroll.current.clientWidth - viewport.labelWidth) / 2,
        );
    }
  }
  function shift(direction: number) {
    setRange({
      zone: sourceZone,
      step,
      start: range.start + direction * 24 * HOUR_MS,
    });
    onSelect(instant + direction * 24 * HOUR_MS);
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
      <div
        ref={scroll}
        className="tz-planner-scroll"
        onMouseLeave={() => setHover(null)}
      >
        <div
          ref={table}
          className="tz-planner-table"
          style={{ "--tz-columns": slots } as CSSProperties}
        >
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
              {visibleSlots.map((hour) => (
                <span
                  key={hour}
                  style={{ gridColumn: hour + 1 }}
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
                  data-minute-view={step < 60}
                  ref={(element) => {
                    if (element) rowRefs.current.set(zone, element);
                    else rowRefs.current.delete(zone);
                  }}
                  onMouseLeave={() => setHover(null)}
                >
                  {cells.map((cell) => (
                    <button
                      type="button"
                      key={cell.slot}
                      data-slot={cell.slot}
                      data-last-slot={cell.slot === slots - 1}
                      style={{ gridColumn: cell.slot + 1 }}
                      data-period={cell.period}
                      data-midnight={cell.hour === 0 && cell.minute === 0}
                      className={`${cell.slot === index ? "is-selected" : ""} ${cell.slot === hover ? "is-hovered" : ""}`}
                      aria-pressed={cell.slot === index}
                      tabIndex={
                        cell.slot ===
                        (index >= firstSlot && index < lastSlot
                          ? index
                          : firstSlot)
                          ? 0
                          : -1
                      }
                      onMouseEnter={() => setHover(cell.slot)}
                      onFocus={() => setHover(cell.slot)}
                      onBlur={() => setHover(null)}
                      onClick={() => choose(cell.slot)}
                      onKeyDown={(event) => move(event, cell.slot, zone)}
                      aria-label={`Select ${cell.date} ${formatPlannerTime(cell, hour12)} in ${zone}, UTC offset ${offsetDifference(cell.offset)}`}
                    >
                      {(cell.slot === 0 ||
                        cell.date !==
                          timelineTime(
                            range.start + (cell.slot - 1) * step * 60000,
                            zone,
                          ).date) && (
                        <span className="tz-planner-day-badge">
                          {cell.date.slice(5)}
                        </span>
                      )}
                      <span>
                        {hour12
                          ? cell.hour % 12 || 12
                          : String(cell.hour).padStart(2, "0")}
                      </span>
                      <small className="tz-slot-subline">
                        <span className="tz-minute-digits">
                          {String(cell.minute).padStart(2, "0")}
                        </span>
                        {hour12 && (
                          <span className="tz-period-label">
                            {cell.hour < 12 ? "am" : "pm"}
                          </span>
                        )}
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
        {step < 60 && (
          <>
            <span className="tz-minute-example">30</span> badges show
            minutes.{" "}
          </>
        )}
        The grid always spans 24 elapsed hours. Smaller intervals add more
        scrollable columns. Date labels show local day changes; city rows follow
        daylight saving, so an hour can repeat or be skipped. Left/right arrow
        keys move between columns.
      </p>
    </section>
  );
}
