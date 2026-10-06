"use client";

import { gql } from "@apollo/client";
import type cytoscape from "cytoscape";
import {
    AlertTriangle,
    Check,
    Copy,
    Download,
    ExternalLink,
    GitBranchPlus,
    Maximize2,
    Minus,
    MousePointerClick,
    Plus,
    RotateCw,
    SearchX,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GraphCanvasSkeleton, LoadingRegion } from "@/components/skeletons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import getBrowserClient from "@/lib/apolloBrowser";
import { cn } from "@/lib/utils";
import {
    buildGraphElements,
    type CytoscapeNodeData,
    getGraphStats,
    type GraphResponse,
    mergeGraphs,
    type NodeKind,
} from "./articleGraphController";
import { buildLayout, buildStylesheet, getPalette, GRAPH_LAYOUTS, type GraphLayoutName } from "./graphStyles";

const CytoscapeComponent = dynamic(() => import("react-cytoscapejs"), {
    ssr: false,
    loading: () => <GraphCanvasSkeleton />,
});

const GET_SCI_GRAPH = gql`
    query GetScientificArticlesGraph($doi: String!, $level: Int!) {
        scienceArticleGraph(doi: $doi, level: $level) {
            nodes {
                doi
                title
                description
                authors
                url
            }
            edges {
                first
                second
            }
        }
    }
`;

// The backend requires level >= 1 and resolves every hop against external DOI services, while its
// rate limit is shared by all users. Keep the depth small.
export const MIN_GRAPH_LEVEL = 1;
export const MAX_GRAPH_LEVEL = 4;
const LEVELS = Array.from({ length: MAX_GRAPH_LEVEL - MIN_GRAPH_LEVEL + 1 }, (_, i) => MIN_GRAPH_LEVEL + i);

const clampLevel = (level: number) => Math.min(MAX_GRAPH_LEVEL, Math.max(MIN_GRAPH_LEVEL, level));

async function queryGraph(doi: string, level: number, fetchPolicy: "cache-first" | "network-only") {
    const res = await getBrowserClient().query<GraphResponse>({
        query: GET_SCI_GRAPH,
        variables: { doi, level },
        fetchPolicy,
    });
    return res.data ?? null;
}

type Hover = { node: CytoscapeNodeData; x: number; y: number };

export default function ArticleGraph({ doi, initialLevel = 2 }: Readonly<{ doi: string; initialLevel?: number }>) {
    const t = useTranslations("graph");
    const { resolvedTheme } = useTheme();
    const [level, setLevel] = useState(() => clampLevel(initialLevel));
    const [layoutName, setLayoutName] = useState<GraphLayoutName>("concentric");
    const [data, setData] = useState<GraphResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<"loadFailed" | null>(null);
    const [expandError, setExpandError] = useState(false);
    const [expandingDoi, setExpandingDoi] = useState<string | null>(null);
    const [selectedNode, setSelectedNode] = useState<CytoscapeNodeData | null>(null);
    const [hover, setHover] = useState<Hover | null>(null);
    const [fontFamily, setFontFamily] = useState("sans-serif");
    const cyRef = useRef<cytoscape.Core | null>(null);

    // Canvas text can't use CSS variables, so read the resolved app font once mounted.
    useEffect(() => {
        setFontFamily(getComputedStyle(document.body).fontFamily || "sans-serif");
    }, []);

    const fetchGraph = useCallback(
        async (fetchPolicy: "cache-first" | "network-only", isCancelled: () => boolean = () => false) => {
            setLoading(true);
            setError(null);
            try {
                const graph = await queryGraph(doi, level, fetchPolicy);
                if (!isCancelled()) {
                    setData(graph);
                    setSelectedNode(null);
                }
            } catch (err) {
                console.error("Citation graph query failed:", err);
                if (!isCancelled()) setError("loadFailed");
            } finally {
                if (!isCancelled()) setLoading(false);
            }
        },
        [doi, level],
    );

    useEffect(() => {
        let cancelled = false;
        void fetchGraph("cache-first", () => cancelled);
        return () => {
            cancelled = true;
        };
    }, [fetchGraph]);

    const expandNode = async (nodeDoi: string) => {
        setExpandingDoi(nodeDoi);
        setExpandError(false);
        try {
            const graph = await queryGraph(nodeDoi, 1, "cache-first");
            setData((previous) => mergeGraphs(previous, graph));
        } catch (err) {
            console.error("Expanding citation graph failed:", err);
            setExpandError(true);
        } finally {
            setExpandingDoi(null);
        }
    };

    const elements = useMemo(() => buildGraphElements(data, doi), [data, doi]);
    const stats = useMemo(() => getGraphStats(elements), [elements]);
    const stylesheet = useMemo(() => buildStylesheet(resolvedTheme, fontFamily), [resolvedTheme, fontFamily]);
    const layout = useMemo(() => buildLayout(layoutName, stats.maxDepth), [layoutName, stats.maxDepth]);
    const palette = getPalette(resolvedTheme);

    const clearHighlight = useCallback((cy: cytoscape.Core) => {
        cy.batch(() => {
            cy.elements().removeClass("faded highlighted");
            cy.nodes().not(":selected").removeClass("labeled");
        });
    }, []);

    const bindCy = useCallback(
        (cy: cytoscape.Core) => {
            if (cyRef.current === cy) return;
            cyRef.current?.removeAllListeners();
            cyRef.current = cy;
            cy.minZoom(0.25);
            cy.maxZoom(3);

            // Hover: show the node's label and fade everything outside its direct citations.
            cy.on("mouseover", "node", (evt) => {
                const node = evt.target as cytoscape.NodeSingular;
                cy.batch(() => {
                    cy.elements().addClass("faded");
                    node.closedNeighborhood().removeClass("faded").addClass("highlighted");
                    node.addClass("labeled");
                });
                const position = node.renderedPosition();
                setHover({ node: node.data() as CytoscapeNodeData, x: position.x, y: position.y });
                cy.container()?.style.setProperty("cursor", "pointer");
            });
            cy.on("mouseout", "node", () => {
                clearHighlight(cy);
                setHover(null);
                cy.container()?.style.removeProperty("cursor");
            });
            cy.on("pan zoom", () => setHover(null));
            cy.on("tap", "node", (evt) => {
                const node = evt.target as cytoscape.NodeSingular;
                cy.nodes().removeClass("labeled");
                node.addClass("labeled");
                setSelectedNode(node.data() as CytoscapeNodeData);
            });
            cy.on("tap", (evt) => {
                if (evt.target === cy) {
                    cy.nodes().unselect().removeClass("labeled");
                    setSelectedNode(null);
                }
            });
        },
        [clearHighlight],
    );

    const clearSelection = () => {
        cyRef.current?.nodes().unselect().removeClass("labeled");
        setSelectedNode(null);
    };

    const zoomBy = (factor: number) => {
        const cy = cyRef.current;
        if (!cy) return;
        cy.animate({ zoom: { level: cy.zoom() * factor, renderedPosition: { x: cy.width() / 2, y: cy.height() / 2 } }, duration: 180 });
    };

    const exportPng = () => {
        if (!cyRef.current) return;
        const link = document.createElement("a");
        link.href = cyRef.current.png({ full: true, scale: 2, bg: palette.labelBackground });
        link.download = `${doi.replaceAll("/", "_")}-graph.png`;
        link.click();
    };

    const hasGraph = elements.length > 0;
    const initialLoading = loading && !data;

    return (
        <div className="flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border/70 px-4 py-3 sm:px-6">
                <Segmented label={t("depth")} hint={t("depthHint")}>
                    {LEVELS.map((value) => (
                        <SegmentButton key={value} active={level === value} onClick={() => setLevel(value)} disabled={loading && level !== value}>
                            {value}
                        </SegmentButton>
                    ))}
                </Segmented>

                <Segmented label={t("layout")}>
                    {GRAPH_LAYOUTS.map((name) => (
                        <SegmentButton key={name} active={layoutName === name} onClick={() => setLayoutName(name)} disabled={!hasGraph}>
                            {t(`layouts.${name}`)}
                        </SegmentButton>
                    ))}
                </Segmented>

            </div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
                {/* Canvas */}
                <div
                    data-testid="graph-canvas"
                    className="relative h-80 touch-pan-y bg-[radial-gradient(circle,var(--color-border)_1px,transparent_1px)] bg-size-[18px_18px] sm:h-115"
                >
                    {hasGraph ? (
                        <CytoscapeComponent
                            elements={elements}
                            style={{ width: "100%", height: "100%" }}
                            layout={layout}
                            stylesheet={stylesheet}
                            cy={bindCy}
                            wheelSensitivity={0.25}
                            boxSelectionEnabled={false}
                        />
                    ) : null}

                    {/* Legend */}
                    {hasGraph ? (
                        <div className="pointer-events-none absolute left-3 top-3 hidden flex-col gap-1.5 rounded-xl border border-border/70 bg-background/85 px-3 py-2 text-[11px] text-muted-foreground shadow-sm backdrop-blur sm:flex">
                            <LegendItem kind="root" label={t("legend.root")} palette={palette} />
                            <LegendItem kind="cited" label={t("legend.cited")} palette={palette} />
                            {stats.missing > 0 ? <LegendItem kind="missing" label={t("legend.missing")} palette={palette} /> : null}
                            <span className="mt-0.5 border-t border-border/70 pt-1.5 font-medium text-foreground/80">
                                {t("papers", { count: stats.papers })} · {t("links", { count: stats.links })}
                            </span>
                        </div>
                    ) : null}

                    {/* Actions */}
                    {data ? (
                        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background/90 shadow-sm backdrop-blur">
                            <IconButton label={t("refresh")} onClick={() => void fetchGraph("network-only")} disabled={loading} className="rounded-none">
                                <RotateCw className={cn(loading && "animate-spin")} />
                            </IconButton>
                            <IconButton label={t("exportPng")} onClick={exportPng} disabled={!hasGraph} className="rounded-none border-t border-border/70">
                                <Download />
                            </IconButton>
                        </div>
                    ) : null}

                    {/* Zoom controls */}
                    {hasGraph ? (
                        <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-xl border border-border/70 bg-background/90 shadow-sm backdrop-blur">
                            <IconButton label={t("zoomIn")} onClick={() => zoomBy(1.25)} className="rounded-none">
                                <Plus />
                            </IconButton>
                            <IconButton label={t("zoomOut")} onClick={() => zoomBy(0.8)} className="rounded-none border-y border-border/70">
                                <Minus />
                            </IconButton>
                            <IconButton label={t("fit")} onClick={() => cyRef.current?.animate({ fit: { eles: cyRef.current.elements(), padding: 36 }, duration: 250 })} className="rounded-none">
                                <Maximize2 />
                            </IconButton>
                        </div>
                    ) : null}

                    {/* Hover card */}
                    {hover && hover.node.id !== selectedNode?.id ? (
                        <div
                            className="pointer-events-none absolute z-10 max-w-64 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg"
                            style={{ left: hover.x, top: hover.y - 16 }}
                        >
                            <p className="line-clamp-2 font-semibold">{hover.node.title ?? hover.node.doi}</p>
                            <p className="mt-0.5 text-muted-foreground">
                                {hover.node.kind === "root" ? t("legend.root") : t("depthBadge", { depth: hover.node.depth })}
                            </p>
                        </div>
                    ) : null}

                    {/* States */}
                    {initialLoading ? (
                        <LoadingRegion label={t("loading")} className="absolute inset-0">
                            <GraphCanvasSkeleton />
                        </LoadingRegion>
                    ) : null}
                    {loading && data ? (
                        <div className="absolute inset-0 flex items-start justify-center bg-background/40 pt-4 backdrop-blur-[1px]">
                            <span className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                                <Spinner className="size-3.5" /> {t("loading")}
                            </span>
                        </div>
                    ) : null}
                    {!loading && error ? (
                        <CanvasState
                            icon={<AlertTriangle className="size-6 text-destructive" />}
                            title={t(error)}
                            action={
                                <Button size="sm" variant="outline" onClick={() => void fetchGraph("network-only")}>
                                    <RotateCw /> {t("retry")}
                                </Button>
                            }
                        />
                    ) : null}
                    {!loading && !error && data && !hasGraph ? (
                        <CanvasState icon={<SearchX className="size-6 text-muted-foreground" />} title={t("empty")} description={t("emptyHint")} />
                    ) : null}
                </div>

                {/* Phones: legend as a strip under the canvas so it doesn't cover the graph. */}
                {hasGraph ? (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/70 px-4 py-2.5 text-[11px] text-muted-foreground sm:hidden">
                        <LegendItem kind="root" label={t("legend.root")} palette={palette} />
                        <LegendItem kind="cited" label={t("legend.cited")} palette={palette} />
                        {stats.missing > 0 ? <LegendItem kind="missing" label={t("legend.missing")} palette={palette} /> : null}
                        <span className="ml-auto font-medium text-foreground/80">
                            {t("papers", { count: stats.papers })} · {t("links", { count: stats.links })}
                        </span>
                    </div>
                ) : null}

                {/* Details */}
                <aside className="border-t border-border/70 p-4 sm:p-5 lg:border-l lg:border-t-0">
                    {expandError ? (
                        <p role="alert" className="mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                            {t("expandFailed")}
                        </p>
                    ) : null}
                    {selectedNode ? (
                        <NodeDetails
                            node={selectedNode}
                            expanding={expandingDoi === selectedNode.doi}
                            onExpand={() => void expandNode(selectedNode.doi)}
                            onClose={clearSelection}
                        />
                    ) : (
                        <div className="flex h-full flex-col justify-center gap-3 text-sm text-muted-foreground">
                            <MousePointerClick className="size-5 text-teal-600 dark:text-teal-400" />
                            <p className="font-medium text-foreground">{t("selectHint")}</p>
                            <p className="hidden lg:block">{t("hoverHint")}</p>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
}

function NodeDetails({
    node,
    expanding,
    onExpand,
    onClose,
}: Readonly<{ node: CytoscapeNodeData; expanding: boolean; onExpand: () => void; onClose: () => void }>) {
    const t = useTranslations("graph");
    const [copied, setCopied] = useState(false);
    const shownAuthors = node.authors.slice(0, 3);
    const moreAuthors = node.authors.length - shownAuthors.length;

    const copyDoi = async () => {
        try {
            await navigator.clipboard.writeText(node.doi);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Clipboard can be unavailable (e.g. insecure context); the DOI stays selectable.
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <span
                    className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
                        node.kind === "root" && "bg-teal-700 text-white dark:bg-teal-400 dark:text-teal-950",
                        node.kind === "cited" && "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-200",
                        node.kind === "missing" && "border border-dashed border-muted-foreground/50 text-muted-foreground",
                    )}
                >
                    {t(`kind.${node.kind}`)}
                </span>
                <IconButton label={t("clearSelection")} onClick={onClose} className="-mr-2 -mt-1.5">
                    <X />
                </IconButton>
            </div>

            <div>
                <p className="line-clamp-4 font-semibold leading-snug text-foreground">{node.title ?? node.doi}</p>
                {node.kind !== "root" ? <p className="mt-1 text-xs text-muted-foreground">{t("depthBadge", { depth: node.depth })}</p> : null}
            </div>

            {node.kind === "missing" ? (
                <p className="text-sm text-muted-foreground">{t("missingDescription")}</p>
            ) : shownAuthors.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                    {shownAuthors.join(", ")}
                    {moreAuthors > 0 ? ` ${t("authorsMore", { count: moreAuthors })}` : ""}
                </p>
            ) : null}

            <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 py-1 pl-2.5 pr-1">
                <code className="min-w-0 flex-1 truncate text-xs text-foreground">{node.doi}</code>
                <IconButton label={copied ? t("copied") : t("copyDoi")} onClick={() => void copyDoi()} className="size-7">
                    {copied ? <Check className="text-teal-600" /> : <Copy />}
                </IconButton>
            </div>

            <div className="flex flex-wrap gap-2">
                {node.kind !== "missing" ? (
                    <Button size="sm" onClick={onExpand} disabled={expanding}>
                        {expanding ? <Spinner className="size-3.5" /> : <GitBranchPlus />}
                        {t("expand")}
                    </Button>
                ) : null}
                <Button size="sm" variant="outline" asChild>
                    <a href={node.url ?? `https://doi.org/${node.doi}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink /> {t("openSource")}
                    </a>
                </Button>
            </div>
        </div>
    );
}

function Segmented({ label, hint, children }: Readonly<{ label: string; hint?: string; children: ReactNode }>) {
    return (
        <div className="flex items-center gap-2" title={hint}>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border bg-muted/50 p-0.5">
                {children}
            </div>
        </div>
    );
}

function SegmentButton({
    active,
    disabled,
    onClick,
    children,
}: Readonly<{ active: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }>) {
    return (
        <button
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={onClick}
            className={cn(
                "min-w-8 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                active ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
        >
            {children}
        </button>
    );
}

function IconButton({
    label,
    onClick,
    disabled,
    className,
    children,
}: Readonly<{ label: string; onClick: () => void; disabled?: boolean; className?: string; children: ReactNode }>) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={label} onClick={onClick} disabled={disabled} className={className}>
                    {children}
                </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
        </Tooltip>
    );
}

function LegendItem({ kind, label, palette }: Readonly<{ kind: NodeKind; label: string; palette: ReturnType<typeof getPalette> }>) {
    const style =
        kind === "root"
            ? { backgroundColor: palette.root, boxShadow: `0 0 0 3px ${palette.rootRing}` }
            : kind === "cited"
              ? { backgroundColor: palette.near }
              : { backgroundColor: palette.missingFill, border: `1.5px dashed ${palette.missingBorder}` };
    return (
        <span className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full" style={style} />
            {label}
        </span>
    );
}

function CanvasState({ icon, title, description, action }: Readonly<{ icon: ReactNode; title: string; description?: string; action?: ReactNode }>) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            {icon}
            <p className="text-sm font-medium text-foreground">{title}</p>
            {description ? <p className="max-w-sm text-xs text-muted-foreground">{description}</p> : null}
            {action ? <div className="mt-1">{action}</div> : null}
        </div>
    );
}
