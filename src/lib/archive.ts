import type { Portfolio } from "./portfolio";

type Work = Portfolio["otherProjects"][number];

export const scopeLabel: Record<Work["scope"], string> = { solo: "개인", team: "팀" };

const deckLink = (id: string) => ({ label: "발표자료", href: `https://drive.google.com/file/d/${id}/view` });

/** Every outbound link of a work in one list: slides first, then the shipped things. */
export const linksOf = (work: Work) => [...(work.deck ? [deckLink(work.deck)] : []), ...(work.links ?? [])];

/** Category groups in category order, numbered in reading order across groups. One pass over the works. */
export const archiveGroups = ({ otherProjectCategories, otherProjects }: Pick<Portfolio, "otherProjectCategories" | "otherProjects">) => {
  const byCategory = new Map(otherProjectCategories.map(category => [category.id, [] as Work[]]));
  for (const work of otherProjects) byCategory.get(work.category)!.push(work);
  let number = 0;
  return otherProjectCategories.map(category => ({
    ...category,
    works: byCategory.get(category.id)!.map(work => ({ ...work, number: ++number, links: linksOf(work) })),
  }));
};
