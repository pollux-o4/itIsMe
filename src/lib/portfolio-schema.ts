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
    visual: z.enum(["split", "nullfill"]).optional(),
    figure: z
      .object({
        image: id,
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        // Largest and smallest text inside the picture, in source pixels (SPEC 2.11 picture text).
        textMax: z.number().positive().optional(),
        textMin: z.number().positive().optional(),
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
    otherProjectCategories: z.array(z.object({ id, label: text, summary: text })).min(1),
    otherProjects: z.array(
      z.object({
        id,
        title: text,
        category: id,
        highlight: text,
        type: text,
        duration: text,
        stack: text,
        description: text,
        source: text,
        image: id,
        imageAlt: text,
        presentation: z.string().regex(/^[a-zA-Z0-9_-]*$/),
        // Shipped work points at the thing itself instead of slides.
        links: z.array(z.object({ label: text, href: webLink })).optional(),
      }),
    ),
    timelineYears: z.array(z.object({ year: z.string().regex(/^\d{4}$/), note: text })).min(1),
    timeline: z.array(z.object({
      date: z.string().regex(/^\d{4}\.\d{2}(?:–\d{2})?$/),
      // career marks paid work: shown in the timeline, left out of the project count.
      items: z.array(z.object({ text, kind: z.enum(["course", "project", "cert"]), career: z.boolean().optional() })).min(1),
    })),
    experience: z.array(
      z.object({
        period: text,
        organization: text,
        role: text,
      }),
    ),
    // Profile lists run newest first; education is degrees, training is courses.
    education: z.array(
      z.object({ period: text, title: text, description: text }),
    ).min(1),
    training: z.array(
      z.object({ period: text, title: text, description: text }),
    ),
    certifications: z.array(z.object({ date: text, name: text })),
  })
  .superRefine((value, context) => {
    const ids = [...value.projects, ...value.otherProjects].map(item => item.id);
    const reserved = new Set(['start', 'work', 'archive', 'timeline', 'background', 'contact', 'main']);
    if (new Set(ids).size !== ids.length || ids.some(id => reserved.has(id))) {
      context.addIssue({ code: 'custom', message: 'Chapter IDs must be unique and not reserved.' });
    }
    const categories = new Set(value.otherProjectCategories.map(item => item.id));
    const used = new Set(value.otherProjects.map(item => item.category));
    if (categories.size !== value.otherProjectCategories.length || [...categories].some(id => !used.has(id)) || [...used].some(id => !categories.has(id))) {
      context.addIssue({ code: 'custom', path: ['otherProjects'], message: 'Every project needs a known category, and every category at least one project.' });
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
