import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const webLink = z.url({ protocol: /^https?$/ });
const image = z
  .string()
  .refine(
    (value) =>
      value.startsWith("/images/") || value.startsWith("/itIsMe/images/"),
    "Use an image in public/images",
  );
const optionalLink = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  webLink.optional(),
);
const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    summary: z.string(),
    category: z.enum([
      "AI / Vision",
      "Web / Product",
      "Systems / Tools",
      "Research",
    ]),
    tags: z.array(z.string()).default([]),
    image,
    imageAlt: z.string(),
    year: z.string(),
    role: z.string(),
    problem: z.string(),
    approach: z.string(),
    outcome: z.string(),
    published: z.boolean().default(false),
    sample: z.boolean().default(true),
    order: z.number().default(0),
    github: optionalLink,
    demo: optionalLink,
    gallery: z.array(z.object({ image, caption: z.string() })).default([]),
  }),
});
const notes = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/notes" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    image: z.preprocess(
      (value) => (value === "" || value === null ? undefined : value),
      image.optional(),
    ),
    published: z.boolean().default(false),
    sample: z.boolean().default(true),
  }),
});
export const collections = { projects, notes };
