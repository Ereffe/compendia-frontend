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
        className="flex h-10 w-full items-center gap-2.5 rounded-md border border-input bg-card px-3 text-left text-sm text-muted-foreground transition-colors hover:border-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("openLabel")}
      >
        <Search className="size-4 shrink-0" aria-hidden />
        <span className="truncate">{t("buttonLabel")}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-2xl gap-0 border-border p-0 sm:max-w-2xl" showCloseButton closeLabel={tCommon("close")}>
          <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
            <DialogTitle className="font-serif text-2xl font-medium text-foreground">{t("title")}</DialogTitle>
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
                className="h-11 pl-10 text-sm"
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
              {search.status === "idle" ? t("example") : null}
            </div>

            <div className="mt-2 max-h-[52vh] overflow-y-auto pr-1">
              {search.status === "loading" ? (
                <LoadingRegion label={t("searching")} className="block border-t border-border">
                  {Array.from({ length: 3 }, (_, i) => (
                    <SearchResultSkeleton key={i} />
                  ))}
                </LoadingRegion>
              ) : null}
              {search.status === "error" ? (
                <p className="py-6 text-sm text-destructive">{t("failed")}</p>
              ) : null}
              {search.status === "done" && visibleArticles.length === 0 ? (
                <p className="py-6 text-sm text-muted-foreground">{t("noResults")}</p>
              ) : null}
              {visibleArticles.length > 0 ? (
                <ul className="divide-y divide-border border-t border-border">
                  {visibleArticles.map((article) => (
                    <li key={article.id}>
                      <Link
                        href={`/articles/${article.id}`}
                        onClick={() => setOpen(false)}
                        className="-mx-2 block rounded-sm px-2 py-3.5 transition-colors hover:bg-muted"
                      >
                        <h3 className="title-item text-foreground wrap-break-word">{article.title}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          <span>{tCommon("authorBy", { name: article.author ?? tCommon("unknownAuthor") })}</span>
                          <span aria-hidden> · </span>
                          <time dateTime={article.datePosted}>{format.dateTime(new Date(article.datePosted), articleDateFormat)}</time>
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
