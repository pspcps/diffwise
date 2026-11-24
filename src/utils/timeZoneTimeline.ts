import { fixedOffsetMinutes, zonedParts } from "../data/majorTimeZones";
export const HOUR_MS = 3600000;
export function timelineTime(instant: number, zone: string) {
  const parts = zonedParts(new Date(instant), zone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const value = (name: string) =>
    parts.find((part) => part.type === name)?.value ?? "00";
  const hour = Number(value("hour")),
    minute = Number(value("minute"));
  const date = `${value("year")}-${value("month")}-${value("day")}`;
  const fixed = fixedOffsetMinutes(zone);
  const offset =
    fixed ??
    Math.round(
      (Date.UTC(
        Number(value("year")),
        Number(value("month")) - 1,
        Number(value("day")),
        hour,
        minute,
      ) -
        Math.floor(instant / 60000) * 60000) /
        60000,
    );
  return {
    hour,
    minute,
    date,
    time: `${value("hour")}:${value("minute")}`,
    offset,
    period:
      hour >= 9 && hour < 17
        ? "work"
        : hour >= 7 && hour < 22
          ? "evening"
          : "night",
  };
}
export function plannerStart(instant: number, zone: string) {
  const time = timelineTime(instant, zone);
  return (
    Math.floor(instant / 60000) * 60000 - time.minute * 60000 - 6 * HOUR_MS
  );
}
export function offsetDifference(minutes: number) {
  const sign = minutes < 0 ? "−" : "+";
  const absolute = Math.abs(minutes);
  return `${sign}${Math.floor(absolute / 60)}h${absolute % 60 ? ` ${absolute % 60}m` : ""}`;
}
export function shortZoneLabel(zone: string) {
  return zone === "UTC"
    ? "UTC"
    : zone.startsWith("UTC")
      ? zone
      : zone.split("/").at(-1)!.replaceAll("_", " ");
}
