import { z } from "astro/zod";
const text = z.string().min(1);
const id = z.string().regex(/^[a-z0-9-]+$/);
const optionalText = z.preprocess(value => value === "" || value === null ? undefined : value, text.optional());
const webLink = z.url({ protocol: /^https$/ });

export const portfolioSchema = z
  .object({
    name: text,
    english: text,
    role: text,
    headline: text,
    portrait: z.object({ headline: text, description: text }),
    email: z.email(),
    sourceDate: text,
    projects: z
      .array(
        z.object({
          id,
          number: text,
          category: text,
          navigationLabel: text,
          cardTitle: text,
          cardRole: text,
          preview: z.object({
            isDefault: z.boolean(),
            figure: z.preprocess(value => value === "" || value === null ? undefined : value, z.number().int().nonnegative().optional()),
            title: optionalText,
            caption: optionalText,
          }),
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
          steps: z.array(text).length(3),
          problem: text,
          decision: text,
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
  .superRefine((value, context) => {
    const ids = [...value.projects, ...value.otherProjects].map(item => item.id);
    const reserved = new Set(['start', 'archive', 'background', 'contact', 'main']);
    if (new Set(ids).size !== ids.length || ids.some(id => reserved.has(id))) {
      context.addIssue({ code: 'custom', message: 'Chapter IDs must be unique and not reserved.' });
    }
    if (value.projects.filter(project => project.preview.isDefault).length !== 1) {
      context.addIssue({ code: 'custom', message: 'Exactly one default project preview is required.' });
    }
    value.projects.forEach((project, index) => {
      if (project.kind !== 'service' && (project.preview.figure === undefined || !project.figures[project.preview.figure])) {
        context.addIssue({ code: 'custom', path: ['projects', index, 'preview', 'figure'], message: 'Study preview must reference an existing evidence figure.' });
      }
    });
  });

export type Portfolio = z.infer<typeof portfolioSchema>;
export type Project = Portfolio['projects'][number];
