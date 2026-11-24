import type { Portfolio } from "./portfolio";

type Timeline = Portfolio["timeline"];
export type TimelineKind = Timeline[number]["items"][number]["kind"];

export const kindLabel: Record<TimelineKind, string> = { course: "교육", project: "작업", cert: "자격" };

const monthIndex = (date: string) => {
  const [year, month] = date.slice(0, 7).split(".").map(Number);
  return year * 12 + month;
};

/** Inclusive month span from the first entry to the source date. */
export const spanMonths = (timeline: Timeline, until: string) =>
  monthIndex(until) - monthIndex(timeline[0].date) + 1;

/** Projects only; paid career work is counted in the profile, not here (SPEC 4.6). */
export const projectCount = (timeline: Timeline) =>
  timeline.reduce((sum, entry) => sum + entry.items.filter(item => item.kind === "project" && !item.career).length, 0);

/** Entries grouped under their year heading in one pass. */
export const groupByYear = (timeline: Timeline, years: Portfolio["timelineYears"]) => {
  const byYear = new Map(years.map(year => [year.year, [] as Timeline]));
  for (const entry of timeline) byYear.get(entry.date.slice(0, 4))?.push(entry);
  return years.map(year => ({ ...year, entries: byYear.get(year.year) ?? [] }));
};
