import data from "../data/portfolio.json";
import { portfolioSchema, type Portfolio as Source } from "./portfolio-schema";
import { projectCount } from "./timeline";

type Metric = NonNullable<Source["highlights"][number]["metric"]>;
/** Strategy per derived highlight: each metric reads the record it summarizes. */
const metrics: Record<Metric, (source: Source) => string> = {
  projects: source => String(projectCount(source.timeline)),
};

const resolve = (source: Source) => ({
  ...source,
  highlights: source.highlights.map(item => ({ label: item.label, value: item.value ?? metrics[item.metric!](source) })),
});

export type Portfolio = ReturnType<typeof resolve>;
export const portfolio: Portfolio = resolve(portfolioSchema.parse(data));
