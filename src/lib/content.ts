import { getCollection } from "astro:content";
import { z } from "astro/zod";
import siteData from "../data/site.json";

export const site = z
  .object({
    name: z.string(),
    title: z.string(),
    description: z.string(),
    intro: z.string(),
    headline: z.string(),
    about: z.string(),
    background: z.string(),
    github: z.url({ protocol: /^https$/ }),
    featured: z.array(z.string()),
    sections: z
      .array(
        z.object({
          id: z.enum(["work", "about", "notes"]),
          enabled: z.boolean(),
        }),
      )
      .refine(
        (items) => new Set(items.map((i) => i.id)).size === items.length,
        "Section IDs must be unique",
      ),
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
