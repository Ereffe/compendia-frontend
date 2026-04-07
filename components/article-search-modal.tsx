"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export type ArticleSearchItem = {
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  author: string;
};

type ArticleSearchModalProps = {
  articles: ArticleSearchItem[];
};

export default function ArticleSearchModal({ articles }: ArticleSearchModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return articles;

    return articles.filter((article) => {
      const haystack = [article.title, article.excerpt, article.category, article.author].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [articles, query]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-slate-900/15 bg-white/90 px-5 py-5 text-left shadow-[0_26px_90px_-56px_rgba(15,23,42,0.9)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-700/35"
        aria-label="Open article search"
      >
        <span className="rounded-xl bg-teal-100 p-2.5 text-teal-800 transition-colors group-hover:bg-teal-200">
          <Search className="size-5" />
        </span>
        <div className="flex-1">
          <p className="text-base font-semibold text-slate-900 sm:text-lg">Search articles, topics, or authors</p>
          <p className="mt-1 text-sm text-slate-600">Try: SQL optimization, process scheduling, linked lists...</p>
        </div>
        <span className="hidden rounded-lg border border-slate-900/10 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-slate-500 sm:inline-block">
          Open
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full max-w-3xl rounded-2xl border-slate-200 p-0 sm:max-w-3xl" showCloseButton>
          <DialogHeader className="border-b border-slate-200 px-6 pb-4 pt-6 text-left">
            <DialogTitle className="text-xl font-semibold text-slate-900">Search Articles</DialogTitle>
            <DialogDescription className="text-sm text-slate-600">
              Start typing to filter by title, category, excerpt, or author.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 pt-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search articles..."
                className="h-11 rounded-xl border-slate-300 pl-10 text-sm"
                autoFocus
              />
            </div>

            <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
              {filteredArticles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                  No articles found for this query.
                </div>
              ) : (
                filteredArticles.map((article) => (
                  <article key={article.title} className="rounded-xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest">
                      <span className="rounded-full bg-teal-100 px-2 py-0.5 text-teal-800">{article.category}</span>
                      <span className="text-slate-500">{article.publishedAt}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-slate-900">{article.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                    <p className="mt-2 text-xs font-medium text-slate-700">By {article.author}</p>
                  </article>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}