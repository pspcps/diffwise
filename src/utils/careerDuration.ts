export const CAREER_START_DATE = "2017-01-02";
/** Completed calendar years/months since 2 January 2017. */
const [startYear, startMonth, startDay] =
  CAREER_START_DATE.split("-").map(Number);
export function getCareerDuration(today = new Date()) {
  const elapsed = Math.max(
    0,
    (today.getFullYear() - startYear) * 12 +
      today.getMonth() -
      (startMonth - 1) -
      (today.getDate() < startDay ? 1 : 0),
  );
  const years = Math.floor(elapsed / 12),
    months = elapsed % 12;
  return {
    years,
    months,
    label: `${years}+`,
    description: `${years} ${years === 1 ? "year" : "years"}${months ? ` ${months} ${months === 1 ? "month" : "months"}` : ""} since 2 January 2017`,
  };
}
