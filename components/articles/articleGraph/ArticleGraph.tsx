"use client";

import type cytoscape from "cytoscape";
import {
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
import { SCIENCE_ARTICLE_GRAPH_QUERY } from "@/services/graphql/graph";
import {
    buildGraphElements,
    type CytoscapeNodeData,
    getGraphStats,
    buildCitationGraph,
    type DoiRecord,
    type GraphNode,
    MAX_DOI_LOOKUPS,
    normalizeGraph,
    pickNextLookup,
    type NodeKind,
    toNodeId,
} from "./articleGraphController";
import { clearDoiRecordCache, fetchDoiRecord } from "./doiMetadata";
import { buildLayout, buildStylesheet, getPalette, GRAPH_LAYOUTS, type GraphLayoutName } from "./graphStyles";

const CytoscapeComponent = dynamic(() => import("react-cytoscapejs"), {
    ssr: false,
    loading: () => <GraphCanvasSkeleton />,
});

export const MIN_GRAPH_LEVEL = 1;
export const MAX_GRAPH_LEVEL = 4;
const LEVELS = Array.from({ length: MAX_GRAPH_LEVEL - MIN_GRAPH_LEVEL + 1 }, (_, i) => MIN_GRAPH_LEVEL + i);

const clampLevel = (level: number) => Math.min(MAX_GRAPH_LEVEL, Math.max(MIN_GRAPH_LEVEL, level));

async function queryBackendGraph(doi: string) {
    const res = await getBrowserClient().query({ query: SCIENCE_ARTICLE_GRAPH_QUERY, variables: { doi, level: 1 } });
    return normalizeGraph(res.data ?? null)?.scienceArticleGraph ?? null;
}

type LoadedRecord = { record: DoiRecord; fallbackNodes: GraphNode[] };

// Papers without references in Crossref (e.g. arXiv) fall back to the backend's slow scraper, one level only.
async function loadRecord(doi: string, isRoot: boolean): Promise<LoadedRecord> {
    const record = await fetchDoiRecord(doi);
    if (!isRoot || record.references.length > 0) return { record, fallbackNodes: [] };
    try {
        const graph = await queryBackendGraph(doi);
        if (!graph) return { record, fallbackNodes: [] };
        const rootId = toNodeId(doi);
        const nodes = graph.nodes.filter((node) => node.title);
        return {
            record: {
                node: record.node ?? nodes.find((node) => toNodeId(node.doi) === rootId) ?? null,
                references: graph.edges.filter((edge) => toNodeId(edge.first) === rootId).map((edge) => edge.second),
            },
            fallbackNodes: nodes,
        };
    } catch (err) {
        console.error("Citation graph fallback query failed:", err);
        return { record, fallbackNodes: [] };
    }
}

type Hover = { node: CytoscapeNodeData; x: number; y: number };

const readSerifFont = () => {
    const serif = getComputedStyle(document.body).getPropertyValue("--font-newsreader").trim();
    return serif ? `${serif}, ui-serif, Georgia, serif` : getComputedStyle(document.body).fontFamily || "serif";
};

export default function ArticleGraph({ doi, initialLevel = 2 }: Readonly<{ doi: string; initialLevel?: number }>) {
    const t = useTranslations("graph");
    const { resolvedTheme } = useTheme();
    const [level, setLevel] = useState(() => clampLevel(initialLevel));
    const [layoutName, setLayoutName] = useState<GraphLayoutName>("concentric");
    const [records, setRecords] = useState<ReadonlyMap<string, DoiRecord>>(() => new Map());
    const [fallbackNodes, setFallbackNodes] = useState<ReadonlyMap<string, GraphNode>>(() => new Map());
    const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hover, setHover] = useState<Hover | null>(null);
    const [fontFamily, setFontFamily] = useState("sans-serif");
    const cyRef = useRef<cytoscape.Core | null>(null);

    const rootId = toNodeId(doi);
    const citation = useMemo(() => buildCitationGraph(doi, records, level, expanded, fallbackNodes), [doi, records, level, expanded, fallbackNodes]);
    const elements = useMemo(() => buildGraphElements(citation.graph, doi), [citation.graph, doi]);
    const stats = useMemo(() => getGraphStats(elements), [elements]);
    const selectedNode = selectedId ? (elements.find((element) => element.data.id === selectedId)?.data as CytoscapeNodeData | undefined) ?? null : null;
    const nextLookup = pickNextLookup(elements, records, selectedId);

    useEffect(() => {
        if (!nextLookup) return;
        void loadRecord(nextLookup, toNodeId(nextLookup) === rootId).then(({ record, fallbackNodes: found }) => {
            setRecords((previous) => new Map(previous).set(toNodeId(nextLookup), record));
            if (found.length > 0) {
                setFallbackNodes((previous) => new Map([...previous, ...found.map((node) => [toNodeId(node.doi), node] as const)]));
            }
        });
    }, [nextLookup, rootId]);

    const rootRecord = records.get(rootId);
    const budgetLeft = records.size < MAX_DOI_LOOKUPS;
    const initialLoading = !rootRecord;
    const loadingDepth = citation.waiting && budgetLeft && !initialLoading;
    const depthLimited = citation.waiting && !budgetLeft;
    const isEmpty = rootRecord !== undefined && citation.graph.scienceArticleGraph.edges.length === 0;
    const selectedRecord = selectedNode ? records.get(selectedNode.id) : undefined;
    const selectedExpanded = selectedNode ? expanded.has(selectedNode.id) : false;
    const expandError = selectedExpanded && selectedRecord?.references.length === 0;

    const expandNode = (nodeId: string) => setExpanded((previous) => new Set(previous).add(nodeId));

    const refresh = () => {
        clearDoiRecordCache();
        setRecords(new Map());
        setFallbackNodes(new Map());
        setExpanded(new Set());
        setSelectedId(null);
    };

    const stylesheet = useMemo(() => buildStylesheet(resolvedTheme, fontFamily), [resolvedTheme, fontFamily]);
    const structureKey = stats.papers;
    const layout = useMemo(
        () => Object.assign(buildLayout(layoutName, stats.maxDepth), { structureKey }),
        [layoutName, stats.maxDepth, structureKey],
    );
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
            setFontFamily(readSerifFont());
            cy.minZoom(0.25);
            cy.maxZoom(3);

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
                setSelectedId(node.id());
            });
            cy.on("tap", (evt) => {
                if (evt.target === cy) {
                    cy.nodes().unselect().removeClass("labeled");
                    setSelectedId(null);
                }
            });
        },
        [clearHighlight],
    );

    const clearSelection = () => {
        cyRef.current?.nodes().unselect().removeClass("labeled");
        setSelectedId(null);
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

    const hasGraph = !initialLoading && !isEmpty && elements.length > 0;

    return (
        <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border/70 px-4 py-3 sm:px-6">
                <Segmented label={t("depth")} hint={t("depthHint")}>
                    {LEVELS.map((value) => (
                        <SegmentButton key={value} active={level === value} onClick={() => setLevel(value)}>
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

                {depthLimited ? <p className="text-xs text-muted-foreground">{t("depthLimited", { depth: citation.shownDepth })}</p> : null}
                {citation.hidden > 0 ? <p className="text-xs text-muted-foreground">{t("hiddenPapers", { count: citation.hidden })}</p> : null}
            </div>

            <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
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
                            boxSelectionEnabled={false}
                        />
                    ) : null}

                    {hasGraph ? (
                        <div className="pointer-events-none absolute left-3 top-3 hidden flex-col gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground sm:flex">
                            <LegendItem kind="root" label={t("legend.root")} palette={palette} />
                            <LegendItem kind="cited" label={t("legend.cited")} palette={palette} />
                            {stats.missing > 0 ? <LegendItem kind="missing" label={t("legend.missing")} palette={palette} /> : null}
                            <span className="mt-0.5 border-t border-border/70 pt-1.5 font-medium text-foreground/80">
                                {t("papers", { count: stats.papers })} · {t("links", { count: stats.links })}
                            </span>
                        </div>
                    ) : null}

                    {rootRecord ? (
                        <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-md border border-border bg-card">
                            <IconButton label={t("refresh")} onClick={refresh} className="rounded-none">
                                <RotateCw className={cn(loadingDepth && "animate-spin")} />
                            </IconButton>
                            <IconButton label={t("exportPng")} onClick={exportPng} disabled={!hasGraph} className="rounded-none border-t border-border/70">
                                <Download />
                            </IconButton>
                        </div>
                    ) : null}

                    {hasGraph ? (
                        <div className="absolute bottom-3 right-3 flex flex-col overflow-hidden rounded-md border border-border bg-card">
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

                    {hover && hover.node.id !== selectedNode?.id ? (
                        <div
                            className="pointer-events-none absolute z-10 max-w-64 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm"
                            style={{ left: hover.x, top: hover.y - 16 }}
                        >
                            <p className="line-clamp-2 font-serif text-sm font-medium leading-snug">{hover.node.title ?? hover.node.doi}</p>
                            <p className="mt-0.5 text-muted-foreground">
                                {hover.node.kind === "root" ? t("legend.root") : t("depthBadge", { depth: hover.node.depth })}
                            </p>
                        </div>
                    ) : null}

                    {initialLoading ? (
                        <LoadingRegion label={t("loading")} className="absolute inset-0">
                            <GraphCanvasSkeleton />
                        </LoadingRegion>
                    ) : null}
                    {loadingDepth && hasGraph ? (
                        <div className="absolute inset-0 flex items-start justify-center bg-card/40 pt-4">
                            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                                <Spinner className="size-3.5" /> {t("loading")}
                            </span>
                        </div>
                    ) : null}
                    {isEmpty ? (
                        <CanvasState icon={<SearchX className="size-6 text-muted-foreground" />} title={t("empty")} description={t("emptyHint")} />
                    ) : null}
                </div>

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

                <aside className="border-t border-border/70 p-4 sm:p-5 lg:border-l lg:border-t-0">
                    {expandError ? (
                        <p role="alert" className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                            {t("expandFailed")}
                        </p>
                    ) : null}
                    {selectedNode ? (
                        <NodeDetails
                            node={selectedNode}
                            expanding={selectedExpanded && !selectedRecord}
                            canExpand={!selectedExpanded && selectedNode.depth >= citation.shownDepth && (selectedRecord?.references.length ?? 1) > 0}
                            lookingUp={!selectedRecord && budgetLeft}
                            onExpand={() => expandNode(selectedNode.id)}
                            onClose={clearSelection}
                        />
                    ) : (
                        <div className="flex h-full flex-col justify-center gap-3 text-sm text-muted-foreground">
                            <MousePointerClick className="size-5 text-muted-foreground" />
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
    canExpand,
    lookingUp,
    onExpand,
    onClose,
}: Readonly<{
    node: CytoscapeNodeData;
    expanding: boolean;
    canExpand: boolean;
    lookingUp: boolean;
    onExpand: () => void;
    onClose: () => void;
}>) {
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
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
                <span
                    className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
                        node.kind === "root" && "bg-teal-800 text-white dark:bg-teal-300 dark:text-teal-950",
                        node.kind === "cited" && "bg-teal-50 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
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
                <p className="line-clamp-4 font-serif text-[1.0625rem] font-medium leading-snug text-foreground">{node.title ?? node.doi}</p>
                {node.kind !== "root" ? <p className="mt-1 text-xs text-muted-foreground">{t("depthBadge", { depth: node.depth })}</p> : null}
            </div>

            {lookingUp ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Spinner className="size-3.5" /> {t("lookingUp")}
                </p>
            ) : node.kind === "missing" ? (
                <p className="text-sm text-muted-foreground">{t("missingDescription")}</p>
            ) : shownAuthors.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                    {shownAuthors.join(", ")}
                    {moreAuthors > 0 ? ` ${t("authorsMore", { count: moreAuthors })}` : ""}
                </p>
            ) : null}

            <div className="flex items-center gap-1 rounded-md border border-border bg-muted/40 py-1 pl-2.5 pr-1">
                <code className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">doi:{node.doi}</code>
                <IconButton label={copied ? t("copied") : t("copyDoi")} onClick={() => void copyDoi()} className="size-7">
                    {copied ? <Check className="text-teal-700 dark:text-teal-300" /> : <Copy />}
                </IconButton>
            </div>

            <div className="flex flex-wrap gap-2">
                {canExpand || expanding ? (
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
            <span className="text-sm text-muted-foreground">{label}</span>
            <div role="group" aria-label={label} className="inline-flex rounded-md border border-border bg-muted/50 p-0.5">
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
                "min-w-8 rounded-sm px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
