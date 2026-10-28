import { getCollection } from "astro:content";
import { z } from "astro/zod";
import siteData from "../data/site.json";

export const site = z
  .object({
    title: z.string(),
    description: z.string(),
    intro: z.string(),
    github: z.url({ protocol: /^https$/ }),
  })
  .parse(siteData);
export const base = import.meta.env.BASE_URL.replace(/\/$/, "");
export const url = (path = "") => `${base}/${path.replace(/^\//, "")}`;
export const asset = (path: string) =>
  path.startsWith(`${base}/`) ? path : url(path);
export async function publicProjects() {
  const entries = (
    await getCollection("projects", ({ data }) => data.published)
  ).sort((a, b) => a.data.order - b.data.order);
  const slugs = entries.map((entry) => entry.data.slug);
  if (new Set(slugs).size !== slugs.length)
    throw new Error("Project slugs must be unique.");
  return entries;
}

export const portfolioImage = (name: string) => asset(`/images/portfolio/${name}.webp`);
