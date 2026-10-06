import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ARTICLE_SORTS, type ArticleFilters as Filters, articleFiltersHref } from "@/lib/articleFilters";
import { cn } from "@/lib/utils";
import type { ArticleComplexity } from "@/types/articles";

const LEVELS: Array<ArticleComplexity | null> = [null, "SIMPLE", "INTERMEDIATE", "COMPLEX"];

function Segmented({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-1.5 sm:w-auto">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div role="group" aria-label={label} className="flex max-w-full overflow-x-auto">
        <div className="flex w-full shrink-0 gap-1 rounded-full border border-border/70 bg-card/70 p-1 sm:inline-flex sm:w-auto">
          {children}
        </div>
      </div>
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
        "flex-1 whitespace-nowrap rounded-full px-2 py-1.5 text-center text-[0.8125rem] transition-colors sm:flex-none sm:px-3 sm:text-sm",
        active ? "bg-foreground font-medium text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export default async function ArticleFilters({ filters }: Readonly<{ filters: Filters }>) {
  const t = await getTranslations();

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-4">
      <Segmented label={t("articles.sortLabel")}>
        {ARTICLE_SORTS.map((sort) => (
          <Option key={sort} href={articleFiltersHref({ ...filters, sort })} active={filters.sort === sort}>
            {t(`articles.sorts.${sort}`)}
          </Option>
        ))}
      </Segmented>
      <Segmented label={t("articles.levelLabel")}>
        {LEVELS.map((level) => (
          <Option key={level ?? "all"} href={articleFiltersHref({ ...filters, level })} active={filters.level === level}>
            {level ? t(`complexity.${level}`) : t("articles.allLevels")}
          </Option>
        ))}
      </Segmented>
    </div>
  );
}
