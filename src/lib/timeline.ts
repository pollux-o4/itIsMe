import type { Portfolio } from "./portfolio-schema";

type Timeline = Portfolio["timeline"];
type Item = Timeline[number]["items"][number];
export type Release = NonNullable<Item["release"]>;

const isCareer = (item: Item) => item.career === true;
/** Projects only; paid career work is counted in the profile, not here (SPEC 4.6). */
const isProject = (item: Item) => item.kind === "project" && !isCareer(item);
const isBar = (item: Item) => item.kind === "course" || isCareer(item);

/** Projects the record holds; the profile highlight reads this instead of a typed number. */
export const projectCount = (timeline: Timeline) => timeline.reduce((sum, entry) => sum + entry.items.filter(isProject).length, 0);

export const releaseLabel: Record<Release, string> = { live: "운영 중", ended: "배포 종료" };

/** Legend categories, one rule each: the key's counts and the bars' tags read the same table. */
const legendRules = [
  { kind: "project", label: "프로젝트", test: isProject },
  { kind: "live", label: releaseLabel.live, test: (item: Item) => item.release === "live" },
  { kind: "ended", label: releaseLabel.ended, test: (item: Item) => item.release === "ended" },
  { kind: "course", label: "교육", test: (item: Item) => item.kind === "course" },
  { kind: "career", label: "실무", test: isCareer },
  { kind: "cert", label: "자격증", test: (item: Item) => item.kind === "cert" },
] as const;
type LegendKind = (typeof legendRules)[number]["kind"];
const labelOf = Object.fromEntries(legendRules.map(rule => [rule.kind, rule.label])) as Record<LegendKind, string>;

/** Each category with how many items it holds, so the key doubles as the section's summary. */
export const legend = (items: Item[]) =>
  legendRules.map(({ kind, label, test }) => ({ kind, label, count: items.filter(test).length }));

export const barLabel = (bar: Item) => labelOf[isCareer(bar) ? "career" : "course"];

/** Last month the timeline reaches, e.g. "2026.11–12" → "2026.12"; the record's own end, not the page's source date. */
export const lastMonth = (timeline: Timeline) => {
  const date = timeline.at(-1)!.date;
  return date.includes("–") ? `${date.slice(0, 5)}${date.split("–")[1]}` : date;
};

/** Entries grouped under their year heading in one pass. */
export const groupByYear = (timeline: Timeline, years: Portfolio["timelineYears"]) => {
  const byYear = groupBy(timeline, entry => entry.date.slice(0, 4));
  return years.map(year => ({ ...year, entries: byYear.get(year.year) ?? [] }));
};

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
  const lanes = { tiles: [] as typeof placed, bars: [] as typeof placed, certs: [] as typeof placed };
  for (const item of placed) {
    const lane = laneOf(item);
    if (lane) lanes[lane].push(item);
  }
  return { ...lanes, tilesByMonth: groupBy(lanes.tiles, tile => tile.month) };
};

/** Which track an item is drawn on; one rule per lane, so placement is a single pass. */
const laneOf = (item: Item) => isProject(item) ? "tiles" : isBar(item) ? "bars" : item.kind === "cert" ? "certs" : undefined;

/** Buckets items by key in one pass, keeping their order. */
export const groupBy = <T, K>(items: readonly T[], keyOf: (item: T) => K) => {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const group = groups.get(key);
    if (group) group.push(item); else groups.set(key, [item]);
  }
  return groups;
};

/** Splits "이름 · 팀" into the visible name and the role note, which stays for screen readers only. */
export const splitLabel = (text: string) => {
  const at = text.indexOf(" · ");
  return at < 0 ? { name: text, note: "" } : { name: text.slice(0, at), note: text.slice(at) };
};

/** A certificate within two months of the previous one drops a row, since its label would run into that one. */
export const stackCerts = <T extends { month: number }>(certs: T[]) => {
  let previous: { month: number; row: number } | undefined;
  return certs.map(cert => {
    const row = previous && cert.month - previous.month <= 2 ? previous.row + 1 : 1;
    previous = { month: cert.month, row };
    return { cert, row };
  });
};
