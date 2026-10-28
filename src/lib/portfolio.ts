import { z } from "astro/zod";
import data from "../data/portfolio.json";
const text = z.string().min(1);
const id = z.string().regex(/^[a-z0-9-]+$/);
const webLink = z.url({ protocol: /^https$/ });
export const portfolio = z
  .object({
    name: text,
    english: text,
    role: text,
    headline: text,
    email: z.email(),
    sourceDate: text,
    projects: z
      .array(
        z.object({
          id,
          number: text,
          category: text,
          label: text,
          title: text,
          period: text,
          team: text,
          role: text,
          summary: text,
          outcomeLabel: text,
          outcome: text,
          outcomeNote: text,
          tags: z.array(text),
          source: text,
          kind: z.enum(["validation", "safety", "service"]),
          steps: z.array(text).length(3),
          problem: text,
          decision: text,
          boundary: text,
          facts: z.array(z.object({ value: text, label: text })),
          details: z.array(z.object({ heading: text, text: text })),
          figures: z.array(z.object({ image: id, caption: text })),
          link: webLink,
        }),
      )
      .length(3),
    otherProjects: z.array(
      z.object({
        id,
        title: text,
        type: text,
        duration: text,
        stack: text,
        description: text,
        source: text,
        image: id,
        imageAlt: text,
        presentation: z.string().regex(/^[a-zA-Z0-9_-]*$/),
      }),
    ),
    recordNote: text,
    experience: z.array(
      z.object({
        period: text,
        organization: text,
        role: text,
        summary: text,
        details: text,
        source: text,
      }),
    ),
    education: z.array(
      z.object({ period: text, title: text, description: text }),
    ),
    certifications: z.array(z.object({ date: text, name: text })),
    additional: z.array(z.object({ date: text, title: text, note: text })),
  })
  .parse(data);
const ids = [...portfolio.projects, ...portfolio.otherProjects].map(
  (p) => p.id,
);
if (new Set(ids).size !== ids.length)
  throw new Error("Portfolio chapter IDs must be unique.");
