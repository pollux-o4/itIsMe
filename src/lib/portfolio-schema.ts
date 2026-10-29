import { z } from "astro/zod";
const text = z.string().min(1);
const id = z.string().regex(/^[a-z0-9-]+$/);
const webLink = z.url({ protocol: /^https$/ });
const unit = z.number().min(0).max(1);
// Every picture on a case answers one claim and says where to look (docs/design/SPEC.md 2.11).
const evidence = z
  .object({
    claim: text,
    why: text,
    visual: z.enum(["split"]).optional(),
    figure: z
      .object({
        image: id,
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        alt: text,
        caption: text,
        page: text.optional(),
        marks: z.array(z.object({ x: unit, y: unit, w: unit, h: unit, label: text })).max(4).default([]),
      })
      .optional(),
  })
  .refine(item => Boolean(item.visual) !== Boolean(item.figure), { message: 'Evidence needs exactly one picture: a visual or a figure.' })
  .refine(item => !item.figure || item.figure.marks.every(mark => mark.x + mark.w <= 1.001 && mark.y + mark.h <= 1.001), { message: 'Marks must stay inside the figure.' });

export const portfolioSchema = z
  .object({
    name: text,
    english: text,
    role: text,
    motto: text,
    headline: text,
    about: z.object({ lead: text, thesis: text, motivation: text }),
    email: z.email(),
    sourceDate: text,
    highlights: z.array(z.object({ value: text, label: text })).min(1),
    projects: z
      .array(
        z.object({
          id,
          number: text,
          category: text,
          navigationLabel: text,
          cardTitle: text,
          cardRole: text,
          headline: text,
          cover: id,
          question: z.object({ label: text, evidence: text }),
          resources: z.array(z.object({ label: text, href: webLink })).default([]),
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
          narrative: z.object({ problem: text, decision: text, action: text, verification: text, limits: text }),
          contribution: z.object({ mine: z.array(text).min(1), team: z.array(text).min(1) }),
          facts: z.array(z.object({ value: text, label: text })),
          details: z.array(z.object({ heading: text, text: text })),
          evidence: z.array(evidence).min(2).max(5),
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
    timelineYears: z.array(z.object({ year: z.string().regex(/^\d{4}$/), note: text })).min(1),
    timeline: z.array(z.object({
      date: z.string().regex(/^\d{4}\.\d{2}(?:–\d{2})?$/),
      items: z.array(z.object({ text, kind: z.enum(["course", "project", "cert"]) })).min(1),
    })),
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
  .superRefine((value, context) => {
    const ids = [...value.projects, ...value.otherProjects].map(item => item.id);
    const reserved = new Set(['start', 'work', 'archive', 'timeline', 'background', 'contact', 'main']);
    if (new Set(ids).size !== ids.length || ids.some(id => reserved.has(id))) {
      context.addIssue({ code: 'custom', message: 'Chapter IDs must be unique and not reserved.' });
    }
    const years = new Set(value.timelineYears.map(item => item.year));
    value.timeline.forEach((entry, index) => {
      if (!years.has(entry.date.slice(0, 4))) {
        context.addIssue({ code: 'custom', path: ['timeline', index, 'date'], message: 'Every timeline entry needs a matching year heading.' });
      }
    });
  });

export type Portfolio = z.infer<typeof portfolioSchema>;
export type Project = Portfolio['projects'][number];
