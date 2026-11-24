import type { z } from "astro/zod";
import data from "../data/portfolio.json";
import { portfolioSchema } from "./portfolio-schema";

export type Portfolio = z.infer<typeof portfolioSchema>;
export const portfolio: Portfolio = portfolioSchema.parse(data);
