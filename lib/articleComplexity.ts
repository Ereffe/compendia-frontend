import type { ArticleComplexity } from "@/types/articles";

export const isKnownComplexity = (value: string): value is ArticleComplexity =>
  value === "SIMPLE" || value === "INTERMEDIATE" || value === "COMPLEX";
