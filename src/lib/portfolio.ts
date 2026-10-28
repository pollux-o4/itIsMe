import data from "../data/portfolio.json";
import { portfolioSchema } from "./portfolio-schema";

export const portfolio = portfolioSchema.parse(data);
