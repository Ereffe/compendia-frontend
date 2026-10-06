"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { LoadingRegion, SearchResultSkeleton } from "@/components/skeletons";
import { Spinner } from "@/components/ui/spinner";
import { articleDateFormat } from "@/services/graphql/articles";
import {
  type ArticleSearchItem,
  SEARCH_DEBOUNCE_MS,
  searchArticles,
  shouldSearch,
} from "./articleSearchModalController";

type ArticleSearchModalProps = {
  articles: ArticleSearchItem[];
};

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; items: ArticleSearchItem[]; total: number }
  | { status: "error" };

type SearchResult = { query: string } & ({ ok: true; items: ArticleSearchItem[]; total: number } | { ok: false });

const getSearchState = (query: string, result: SearchResult | null): SearchState => {
  if (!shouldSearch(query)) return { status: "idle" };
  if (result?.query !== query) return { status: "loading" };
  return result.ok ? { status: "done", items: result.items, total: result.total } : { status: "error" };
};

export default function ArticleSearchModal({ articles }: Readonly<ArticleSearchModalProps>) {
  const t = useTranslations("search");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const search = getSearchState(query, result);

  useEffect(() => {
    if (!shouldSearch(query)) return;

    let cancelled = false;

    const timeoutId = setTimeout(() => {
      searchArticles(query)
        .then(({ items, total }) => {
          if (!cancelled) setResult({ query, ok: true, items, total });
        })
        .catch((error: unknown) => {
          console.error("Article search failed:", error);
          if (!cancelled) setResult({ query, ok: false });
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  let visibleArticles: ArticleSearchItem[] = [];
  if (search.status === "done") visibleArticles = search.items;
  else if (search.status === "idle") visibleArticles = articles;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex w-full items-center gap-3 rounded-2xl border border-border/70 bg-card/90 px-5 py-5 text-left shadow-[0_26px_90px_-56px_rgba(15,23,42,0.9)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-700/35"
        aria-label={t("openLabel")}
      >
        <span className="rounded-xl bg-teal-100 p-2.5 text-teal-800 transition-colors group-hover:bg-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:group-hover:bg-teal-900/60">
          <Search className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground sm:text-lg">{t("buttonLabel")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("example")}</p>
        </div>
        <span className="hidden rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:inline-block">
          {t("open")}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-3xl rounded-2xl border-border p-0 sm:max-w-3xl" showCloseButton closeLabel={tCommon("close")}>
          <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-xl font-semibold text-foreground">{t("title")}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {t("description")}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("placeholder")}
                className="h-11 rounded-xl border-border pl-10 text-sm"
                autoFocus
              />
            </div>

            <div className="mt-2 h-5 text-xs text-muted-foreground" aria-live="polite">
              {search.status === "loading" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-3" /> {t("searching")}
                </span>
              ) : null}
              {search.status === "done" ? t("results", { count: search.total }) : null}
            </div>

            <div className="mt-2 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              {search.status === "loading" ? (
                <LoadingRegion label={t("searching")} className="space-y-3">
                  {Array.from({ length: 3 }, (_, i) => (
                    <SearchResultSkeleton key={i} />
                  ))}
                </LoadingRegion>
              ) : null}
              {search.status === "error" ? (
                <div className="rounded-xl border border-dashed border-destructive/50 p-6 text-center text-sm text-destructive">
                  {t("failed")}
                </div>
              ) : null}
              {search.status === "done" && visibleArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  {t("noResults")}
                </div>
              ) : null}
              {visibleArticles.map((article) => (
                <Link href={`/articles/${article.id}`} className="block" key={article.id} onClick={() => setOpen(false)}>
                  <article className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-700/30 hover:bg-teal-50/40 dark:hover:bg-teal-950/30">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest">
                      <span className="text-muted-foreground">
                        {format.dateTime(new Date(article.datePosted), articleDateFormat)}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-foreground">{article.title}</h3>
                    <p className="mt-2 text-xs font-medium text-foreground/90">
                      {tCommon("authorBy", { name: article.author ?? tCommon("unknownAuthor") })}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
