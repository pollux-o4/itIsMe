import type { Portfolio } from "./portfolio";

type Timeline = Portfolio["timeline"];
export type TimelineKind = Timeline[number]["items"][number]["kind"];

export const kindLabel: Record<TimelineKind, string> = { course: "교육", project: "작업", cert: "자격" };

const monthIndex = (date: string) => {
  const [year, month] = date.slice(0, 7).split(".").map(Number);
  return year * 12 + month;
};

/** Last month the timeline reaches, e.g. "2026.11–12" → "2026.12"; the record's own end, not the page's source date. */
export const lastMonth = (timeline: Timeline) => {
  const date = timeline.at(-1)!.date;
  return date.includes("–") ? `${date.slice(0, 5)}${date.split("–")[1]}` : date;
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

type Item = Timeline[number]["items"][number];
export type Placed = Item & { month: number; end: number; image?: string };

/** Month (1–12) where an entry starts and ends inside its year; ranges like "2025.05–06" end at the second month. */
const monthsOf = (date: string) => {
  const start = Number(date.slice(5, 7));
  const end = date.includes("–") ? Number(date.split("–")[1]) : start;
  return { start, end };
};

/**
 * One year laid on a 12-month axis (SPEC 4.6): project tiles stack on their start month,
 * course and paid work become bars, certificates sit on the month they were earned.
 */
export const placeYear = (entries: Timeline, imageOf: (ref: string) => string | undefined) => {
  const placed = entries.flatMap(entry => {
    const { start, end } = monthsOf(entry.date);
    return entry.items.map(item => ({
      ...item,
      month: item.kind === "cert" ? end : start,
      end: item.until ? Number(item.until.slice(5, 7)) : end,
      image: item.image ?? (item.ref ? imageOf(item.ref) : undefined),
    }));
  });
  const isBar = (item: Placed) => item.kind === "course" || item.career === true;
  return {
    tiles: placed.filter(item => item.kind === "project" && !isBar(item)),
    bars: placed.filter(isBar),
    certs: placed.filter(item => item.kind === "cert"),
  };
};

/** Splits "이름 · 팀" into the visible name and the role note, which stays for screen readers only. */
export const splitLabel = (text: string) => {
  const at = text.indexOf(" · ");
  return at < 0 ? { name: text, note: "" } : { name: text.slice(0, at), note: text.slice(at) };
};
