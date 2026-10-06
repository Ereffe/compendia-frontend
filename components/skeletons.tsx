import type { ReactNode } from "react";

import { Skeleton as BaseSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** shadcn's bg-accent is almost invisible on the app's white cards, so tint with the text color instead. */
export function Skeleton({ className, ...props }: React.ComponentProps<typeof BaseSkeleton>) {
    return <BaseSkeleton className={cn("bg-foreground/8 dark:bg-foreground/12", className)} {...props} />;
}

/*
 * Loading placeholders shaped like the real components, so the page doesn't jump when data arrives.
 * Used by route `loading.tsx` files and by client components while they fetch. Keep the dimensions in
 * sync with the components they mirror.
 */

const card = "rounded-2xl border border-border/70 bg-card/80 backdrop-blur";

/** Wraps a skeleton region: announces "loading" to screen readers and hides the shapes from them. */
export function LoadingRegion({ label, className, children }: Readonly<{ label: string; className?: string; children: ReactNode }>) {
    return (
        <div role="status" aria-busy="true" aria-live="polite" className={className}>
            <span className="sr-only">{label}</span>
            <div aria-hidden className="contents">
                {children}
            </div>
        </div>
    );
}

/** Lines of text with a shorter last line. */
export function TextLinesSkeleton({ lines = 3, className }: Readonly<{ lines?: number; className?: string }>) {
    return (
        <div className={cn("space-y-2.5", className)}>
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-3/5" : "w-full")} />
            ))}
        </div>
    );
}

/** Page title + description, like the h1/p at the top of list pages. */
export function PageHeadingSkeleton({ withMeta = false }: Readonly<{ withMeta?: boolean }>) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-64 sm:h-12 sm:w-96" />
            <div className="max-w-3xl space-y-2.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
            </div>
            {withMeta ? <Skeleton className="h-3.5 w-28" /> : null}
        </div>
    );
}

/** Mirrors app/articles/ArticleCard.tsx (date, centered title, author). */
export function ArticleCardSkeleton() {
    return (
        <div className={cn(card, "p-5")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mx-auto mt-5 h-6 w-2/3" />
            <Skeleton className="mt-5 h-3.5 w-36" />
        </div>
    );
}

/** Mirrors the archive card (date, two-line title, author). */
export function ArchiveCardSkeleton() {
    return (
        <div className={cn(card, "p-5")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-5 h-5 w-full" />
            <Skeleton className="mt-2 h-5 w-3/5" />
            <Skeleton className="mt-4 h-3.5 w-32" />
        </div>
    );
}

/** Mirrors the search entry button on /articles. */
export function SearchBarSkeleton() {
    return (
        <div className={cn(card, "flex items-center gap-3 px-5 py-5")}>
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-full max-w-md" />
            </div>
        </div>
    );
}

/** One search result row in the search modal. */
export function SearchResultSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-3 h-3 w-28" />
        </div>
    );
}

/** Mirrors the article card on /articles/[id] (badge, date, title, author, body). */
export function ArticleBodySkeleton() {
    return (
        <div className={cn(card, "p-5 sm:p-10")}>
            <div className="flex items-center justify-between border-b border-border pb-6">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-3.5 w-20" />
            </div>
            <Skeleton className="mt-6 h-9 w-4/5 sm:h-12" />
            <Skeleton className="mt-3 h-9 w-1/2 sm:hidden" />
            <Skeleton className="mt-5 h-4 w-40" />
            <div className="mt-8 border-t border-border pt-8">
                <TextLinesSkeleton lines={4} />
                <TextLinesSkeleton lines={3} className="mt-6" />
            </div>
        </div>
    );
}

/** Card header used by references, graph and comments (icon, title, subtitle). */
function SectionHeaderSkeleton({ withIcon = true }: Readonly<{ withIcon?: boolean }>) {
    return (
        <div className="flex items-center gap-3 border-b border-border/70 p-4 sm:p-6">
            {withIcon ? <Skeleton className="size-10 shrink-0 rounded-xl" /> : null}
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3.5 w-full max-w-xs" />
            </div>
        </div>
    );
}

/** Mirrors components/articles/articleReferences.tsx. */
export function ReferencesSkeleton({ rows = 2 }: Readonly<{ rows?: number }>) {
    return (
        <div className={cn(card, "overflow-hidden")}>
            <SectionHeaderSkeleton />
            <div className="flex flex-col gap-3 p-4 sm:p-6">
                {Array.from({ length: rows }, (_, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-border/60 p-4 sm:gap-4">
                        <Skeleton className="size-7 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-2.5">
                            <Skeleton className="h-4 w-11/12" />
                            <Skeleton className="h-3.5 w-1/2" />
                            <Skeleton className="mt-3 h-6 w-56 rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/** The graph canvas area: a ring of placeholder nodes around a center. Used inside the graph card. */
export function GraphCanvasSkeleton({ className }: Readonly<{ className?: string }>) {
    const ring = 10;
    return (
        <div className={cn("relative h-full w-full", className)}>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="relative size-48 sm:size-64">
                    <Skeleton className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 rounded-full" />
                    {Array.from({ length: ring }, (_, i) => {
                        const angle = (i / ring) * 2 * Math.PI - Math.PI / 2;
                        return (
                            <Skeleton
                                key={i}
                                className="absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full"
                                style={{ left: `${50 + 45 * Math.cos(angle)}%`, top: `${50 + 45 * Math.sin(angle)}%` }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

/** Mirrors the whole citation graph card (header, picker, toolbar, canvas, details). */
export function GraphCardSkeleton() {
    return (
        <div className={cn(card, "overflow-hidden")}>
            <SectionHeaderSkeleton />
            <div className="flex flex-wrap gap-4 border-b border-border/70 px-4 py-3 sm:px-6">
                <Skeleton className="h-8 w-44 rounded-lg" />
                <Skeleton className="h-8 w-60 rounded-lg" />
            </div>
            <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
                <div className="h-80 sm:h-115">
                    <GraphCanvasSkeleton />
                </div>
                <div className="space-y-3 border-t border-border/70 p-4 sm:p-5 lg:border-l lg:border-t-0">
                    <Skeleton className="size-5 rounded-md" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3.5 w-3/5" />
                </div>
            </div>
        </div>
    );
}

/** Mirrors the comments card (header, textarea, button, two comments). */
export function CommentsSkeleton() {
    return (
        <div className={cn(card, "overflow-hidden")}>
            <SectionHeaderSkeleton withIcon={false} />
            <div className="space-y-6 p-4 sm:p-6">
                <Skeleton className="h-28 w-full rounded-xl" />
                <div className="flex justify-end">
                    <Skeleton className="h-9 w-36 rounded-md" />
                </div>
                {Array.from({ length: 2 }, (_, i) => (
                    <div key={i} className="rounded-2xl border border-border p-4">
                        <div className="flex justify-between gap-3">
                            <div className="space-y-2">
                                <Skeleton className="h-3.5 w-28" />
                                <Skeleton className="h-3 w-36" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-md" />
                        </div>
                        <TextLinesSkeleton lines={2} className="mt-4" />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** Mirrors the Markdown editor (toolbar + text area). */
export function EditorSkeleton({ className }: Readonly<{ className?: string }>) {
    return (
        <div className={cn("flex flex-col", className)}>
            <div className="flex flex-wrap gap-1.5 border-b border-border p-2">
                {Array.from({ length: 12 }, (_, i) => (
                    <Skeleton key={i} className="size-5 rounded" />
                ))}
            </div>
            <div className="flex-1 space-y-2.5 p-3">
                <Skeleton className="h-3.5 w-1/3" />
                <Skeleton className="h-3.5 w-2/3" />
            </div>
        </div>
    );
}

/** Mirrors the create form (main column + settings sidebar). */
export function CreateFormSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
            <div className={cn(card, "space-y-6 p-4 sm:p-6")}>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <div className="overflow-hidden rounded-xl border border-border">
                        <EditorSkeleton className="h-72 lg:h-120" />
                    </div>
                </div>
            </div>
            <div className="flex flex-col gap-6">
                <div className={cn(card, "space-y-3 p-4 sm:p-5")}>
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="mt-2 h-4 w-32" />
                    {Array.from({ length: 3 }, (_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-xl" />
                    ))}
                </div>
                <div className={cn(card, "space-y-3 p-4 sm:p-5")}>
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="mx-auto h-3 w-3/4" />
                </div>
            </div>
        </div>
    );
}
