import type { ReactNode } from "react";

import { Skeleton as BaseSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<typeof BaseSkeleton>) {
    return <BaseSkeleton className={cn("bg-foreground/8 dark:bg-foreground/12", className)} {...props} />;
}


const card = "rounded-2xl border border-border/70 bg-card/80 backdrop-blur";
const readingColumn = "mx-auto w-full max-w-[40rem]";

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

export function TextLinesSkeleton({ lines = 3, className }: Readonly<{ lines?: number; className?: string }>) {
    return (
        <div className={cn("space-y-2.5", className)}>
            {Array.from({ length: lines }, (_, i) => (
                <Skeleton key={i} className={cn("h-3.5", i === lines - 1 ? "w-3/5" : "w-full")} />
            ))}
        </div>
    );
}

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

export function ArticleCardSkeleton() {
    return (
        <div className={cn(card, "p-5")}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mx-auto mt-5 h-6 w-2/3" />
            <Skeleton className="mt-5 h-3.5 w-36" />
        </div>
    );
}

export function ArticleFiltersSkeleton() {
    return (
        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-4">
            {["w-72", "w-80"].map((width) => (
                <div key={width} className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className={cn("h-10 max-w-full rounded-full", width)} />
                </div>
            ))}
        </div>
    );
}

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

export function SearchResultSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-3 h-4 w-3/4" />
            <Skeleton className="mt-3 h-3 w-28" />
        </div>
    );
}

export function ArticleSheetSkeleton() {
    return (
        <div className="sheet">
            <div className="px-5 pb-12 pt-10 sm:px-12 sm:pb-16 sm:pt-16">
                <div className={readingColumn}>
                    <Skeleton className="h-10 w-4/5 sm:h-13" />
                    <Skeleton className="mt-3 h-10 w-1/2 sm:hidden" />
                    <Skeleton className="mt-6 h-4 w-64 max-w-full" />
                </div>
                <div className={cn(readingColumn, "mt-10 border-t border-border pt-10")}>
                    <TextLinesSkeleton lines={4} />
                    <TextLinesSkeleton lines={3} className="mt-7" />
                </div>
            </div>
            <div className="border-t border-border px-5 py-10 sm:px-12 sm:py-14">
                <div className={readingColumn}>
                    <CommentsSkeleton />
                </div>
            </div>
        </div>
    );
}

function SectionHeadingSkeleton() {
    return (
        <div className="flex items-baseline gap-3">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-3.5 w-16" />
        </div>
    );
}

export function ReferencesSkeleton({ rows = 2 }: Readonly<{ rows?: number }>) {
    return (
        <div>
            <SectionHeadingSkeleton />
            <div className="mt-6">
                {Array.from({ length: rows }, (_, i) => (
                    <div key={i} className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2 border-t border-border py-5 first:border-t-0 first:pt-0 sm:grid-cols-[2.25rem_minmax(0,1fr)]">
                        <Skeleton className="h-4 w-4" />
                        <div className="space-y-2.5">
                            <Skeleton className="h-4.5 w-11/12" />
                            <Skeleton className="h-3.5 w-1/2" />
                            <Skeleton className="h-3 w-56 max-w-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

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

export function GraphCardSkeleton() {
    return (
        <div>
            <div className={cn(readingColumn, "space-y-3")}>
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-3.5 w-full max-w-xs" />
            </div>
            <div className="mt-6 overflow-hidden rounded-md border border-border">
                <div className="flex flex-wrap gap-4 border-b border-border px-4 py-3 sm:px-6">
                    <Skeleton className="h-8 w-44 rounded-md" />
                    <Skeleton className="h-8 w-60 rounded-md" />
                </div>
                <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
                    <div className="h-80 sm:h-115">
                        <GraphCanvasSkeleton />
                    </div>
                    <div className="space-y-3 border-t border-border p-4 sm:p-5 lg:border-l lg:border-t-0">
                        <Skeleton className="size-5 rounded-md" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-3.5 w-3/5" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CommentsSkeleton() {
    return (
        <div>
            <SectionHeadingSkeleton />
            <Skeleton className="mt-6 h-24 w-full rounded-md" />
            <div className="mt-3 flex justify-end">
                <Skeleton className="h-9 w-36 rounded-md" />
            </div>
            <div className="mt-8 divide-y divide-border border-t border-border">
                {Array.from({ length: 2 }, (_, i) => (
                    <div key={i} className="flex gap-3 py-5">
                        <Skeleton className="mt-0.5 size-8 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-2">
                                <Skeleton className="h-3.5 w-28" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <TextLinesSkeleton lines={2} className="mt-3" />
                            <Skeleton className="mt-3 h-5 w-40 rounded-md" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

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

export function CreateFormSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
            <div className="sheet overflow-hidden">
                <div className="px-5 pt-5 sm:px-8 sm:pt-7">
                    <Skeleton className="h-4 w-14" />
                    <div className="border-b border-border pb-4 pt-3">
                        <Skeleton className="h-9 w-3/4" />
                    </div>
                </div>
                <div className="px-5 pb-2 pt-6 sm:px-8">
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="px-5 sm:px-8">
                    <div className="overflow-hidden rounded-md border border-border">
                        <EditorSkeleton className="h-75 md:h-125" />
                    </div>
                </div>
                <div className="px-5 py-4 sm:px-8">
                    <Skeleton className="h-3.5 w-80 max-w-full" />
                </div>
            </div>
            <div className="sheet divide-y divide-border">
                {[2, 3].map((rows) => (
                    <div key={rows} className="space-y-3 p-5">
                        <Skeleton className="h-4 w-28" />
                        <div className="divide-y divide-border rounded-md border border-border">
                            {Array.from({ length: rows }, (_, i) => (
                                <div key={i} className="space-y-1.5 px-3 py-2.5">
                                    <Skeleton className="h-3.5 w-24" />
                                    <Skeleton className="h-3 w-4/5" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div className="space-y-3 p-5">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <Skeleton className="h-3 w-3/4" />
                </div>
            </div>
        </div>
    );
}

export function AccountSettingsSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start lg:gap-8">
            <div className="sheet">
                <div className="flex items-center gap-4 px-5 py-6 lg:flex-col lg:items-start lg:gap-5">
                    <Skeleton className="size-20 shrink-0 rounded-3xl lg:size-28" />
                    <div className="w-full space-y-2.5">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-3.5 w-48" />
                        <Skeleton className="h-3.5 w-20" />
                    </div>
                </div>
                <div className="border-t border-border px-5 py-4">
                    <TextLinesSkeleton lines={2} />
                </div>
                <div className="border-t border-border px-5 py-5">
                    <Skeleton className="h-9 w-full rounded-md" />
                </div>
            </div>
            <div className="sheet divide-y divide-border">
                {Array.from({ length: 3 }, (_, i) => (
                    <div key={i} className="grid gap-4 px-5 py-6 sm:px-8 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
                        <div className="space-y-2.5">
                            <Skeleton className="h-5 w-32" />
                            <TextLinesSkeleton lines={2} />
                        </div>
                        <div className="flex flex-col gap-3 sm:flex-row md:pt-7">
                            <Skeleton className="h-9 w-full rounded-md" />
                            <Skeleton className="h-9 w-full rounded-md sm:w-28" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
