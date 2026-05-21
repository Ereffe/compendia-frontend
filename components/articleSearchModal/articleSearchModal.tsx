"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  type ArticleSearchItem,
  filterArticles,
  getNoResultsMessage,
  getSearchButtonLabel,
  getSearchExample,
  getSearchPlaceholder,
} from "./articleSearchModalController";

type ArticleSearchModalProps = {
  articles: ArticleSearchItem[];
};

export default function ArticleSearchModal({
  articles,
}: Readonly<ArticleSearchModalProps>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredArticles = useMemo(() => filterArticles(articles, query), [articles, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-border/70 bg-card/90 px-5 py-5 text-left shadow-[0_26px_90px_-56px_rgba(15,23,42,0.9)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-700/35"
        aria-label="Otwórz wyszukiwarkę artykułów"
      >
        <span className="rounded-xl bg-teal-100 p-2.5 text-teal-800 transition-colors group-hover:bg-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:group-hover:bg-teal-900/60">
          <Search className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-base font-semibold text-foreground sm:text-lg">
            {getSearchButtonLabel()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {getSearchExample()}
          </p>
        </div>
        <span className="hidden rounded-lg border border-border/70 bg-background px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:inline-block">
          Otwórz
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="w-full max-w-3xl rounded-2xl border-border p-0 sm:max-w-3xl"
          showCloseButton
        >
          <DialogHeader className="border-b border-border px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-xl font-semibold text-foreground">
              Wyszukiwanie artykułów
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Zacznij pisać, aby filtrować po tytule, kategorii, fragmencie lub
              autorze.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={getSearchPlaceholder()}
                className="h-11 rounded-xl border-border pl-10 text-sm"
                autoFocus
              />
            </div>

            <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              {filteredArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  {getNoResultsMessage()}
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <Link
                    href={`/articles/${article.id}`}
                    className="block"
                    key={article.id}
                    onClick={() => setOpen(false)}
                  >
                    <article className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-teal-700/30 hover:bg-teal-50/40 dark:hover:bg-teal-950/30">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest">
                        <span className="text-muted-foreground">
                          {article.publishedAt}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-foreground">
                        {article.title}
                      </h3>
                      <p className="mt-2 text-xs font-medium text-foreground/90">
                        By {article.author}
                      </p>
                    </article>
                  </Link>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
