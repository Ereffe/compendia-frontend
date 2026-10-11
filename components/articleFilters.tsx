import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ARTICLE_SORTS, type ArticleFilters as Filters, articleFiltersHref } from "@/lib/articleFilters";
import { cn } from "@/lib/utils";
import type { ArticleComplexity } from "@/types/articles";

const LEVELS: Array<ArticleComplexity | null> = [null, "SIMPLE", "INTERMEDIATE", "COMPLEX"];

function FilterRow({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex min-w-0 items-baseline gap-4">
      <span className="w-16 shrink-0 text-sm text-muted-foreground">{label}</span>
      <fieldset aria-label={label} className="-my-1 flex min-w-0 gap-x-5 overflow-x-auto py-1">
        {children}
      </fieldset>
    </div>
  );
}

function Option({ href, active, children }: Readonly<{ href: string; active: boolean; children: React.ReactNode }>) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "whitespace-nowrap text-sm decoration-1 underline-offset-[6px] transition-colors",
        active ? "font-medium text-foreground underline" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export default async function ArticleFilters({ filters }: Readonly<{ filters: Filters }>) {
  const t = await getTranslations();

  return (
    <div className="flex flex-col gap-2.5">
      <FilterRow label={t("articles.sortLabel")}>
        {ARTICLE_SORTS.map((sort) => (
          <Option key={sort} href={articleFiltersHref({ ...filters, sort })} active={filters.sort === sort}>
            {t(`articles.sorts.${sort}`)}
          </Option>
        ))}
      </FilterRow>
      <FilterRow label={t("articles.levelLabel")}>
        {LEVELS.map((level) => (
          <Option key={level ?? "all"} href={articleFiltersHref({ ...filters, level })} active={filters.level === level}>
            {level ? t(`complexity.${level}`) : t("articles.allLevels")}
          </Option>
        ))}
      </FilterRow>
    </div>
  );
}
