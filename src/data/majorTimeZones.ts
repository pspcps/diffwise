export const MAJOR_TIME_ZONES = [
  [-720, "Baker / Howland Islands", "IDLW"],
  [-660, "American Samoa · Niue", "SST"],
  [-600, "Hawaii · Tahiti", "HST"],
  [-570, "Marquesas Islands", "MART"],
  [-540, "Alaska standard · Gambier", "AKST"],
  [-480, "Pacific standard · Pitcairn", "PST"],
  [-420, "Mountain standard", "MST"],
  [-360, "Central standard · Central America", "CST"],
  [-300, "Eastern standard · Colombia · Peru", "EST"],
  [-240, "Atlantic standard · Guyana · Bolivia", "AST"],
  [-180, "Brasília · Argentina", "BRT"],
  [-120, "Fernando de Noronha · South Georgia", "UTC−02"],
  [-60, "Cape Verde · Azores standard", "CVT"],
  [0, "Greenwich · Western Europe standard · Iceland", "GMT / WET"],
  [60, "Central Europe standard · West Africa", "CET / WAT"],
  [120, "Eastern Europe standard · Central Africa", "EET / CAT"],
  [180, "Moscow · Arabia · East Africa", "MSK / EAT"],
  [210, "Iran", "IRST"],
  [240, "Gulf · Azerbaijan · Samara", "GST / AZT"],
  [270, "Afghanistan", "AFT"],
  [300, "Pakistan · Yekaterinburg", "PKT"],
  [330, "India · Sri Lanka", "IST / SLST"],
  [345, "Nepal", "NPT"],
  [360, "Bangladesh · Bhutan", "BST / BTT"],
  [390, "Myanmar · Cocos Islands", "MMT"],
  [420, "Indochina · Bangkok · Jakarta", "ICT"],
  [480, "China · Singapore · Perth · Manila", "CST / SGT"],
  [540, "Japan · Korea", "JST / KST"],
  [570, "Australian Central standard", "ACST"],
  [600, "Australian Eastern standard · Guam", "AEST / ChST"],
  [660, "Solomon Islands · New Caledonia", "SBT"],
  [720, "Fiji · New Zealand standard", "FJT / NZST"],
  [780, "Tonga · Samoa", "TOT / WST"],
  [840, "Line Islands", "LINT"],
].map(([offset, label, abbreviation]) => {
  const minutes = offset as number;
  const sign = minutes < 0 ? "-" : "+";
  const value = `UTC${sign}${String(Math.floor(Math.abs(minutes) / 60)).padStart(2, "0")}:${String(Math.abs(minutes) % 60).padStart(2, "0")}`;
  return {
    id: minutes === 0 ? "UTC" : value,
    offset: minutes,
    label: label as string,
    abbreviation: abbreviation as string,
    offsetLabel: value,
  };
});
export function fixedOffsetMinutes(zone: string): number | null {
  if (zone === "UTC") return 0;
  const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(zone);
  if (!match) return null;
  const offset =
    (Number(match[2]) * 60 + Number(match[3])) * (match[1] === "-" ? -1 : 1);
  return Number(match[3]) < 60 && offset >= -720 && offset <= 840
    ? offset
    : null;
}
export function zonedParts(
  date: Date,
  zone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const offset = fixedOffsetMinutes(zone);
  return new Intl.DateTimeFormat("en-CA", {
    ...options,
    timeZone: offset === null ? zone : "UTC",
  }).formatToParts(
    offset === null ? date : new Date(date.getTime() + offset * 60000),
  );
}
export function zonedDescription(date: Date, zone: string): string {
  const offset = fixedOffsetMinutes(zone);
  return new Intl.DateTimeFormat(undefined, {
    timeZone: offset === null ? zone : "UTC",
    dateStyle: "full",
    timeStyle: offset === null ? "long" : "medium",
  }).format(offset === null ? date : new Date(date.getTime() + offset * 60000));
}
