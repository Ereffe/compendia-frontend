import type cytoscape from "cytoscape";

export type GraphLayoutName = "concentric" | "breadthfirst" | "cose";
export const GRAPH_LAYOUTS: GraphLayoutName[] = ["concentric", "breadthfirst", "cose"];

type Palette = {
    root: string;
    rootRing: string;
    near: string;
    far: string;
    missingFill: string;
    missingBorder: string;
    edge: string;
    edgeHighlight: string;
    label: string;
    labelBackground: string;
    selected: string;
};

// One teal family (the app's accent): the further a paper is from the reference, the lighter it gets.
// Everything else uses the page's neutral greys (globals.css tokens as hex, since the canvas can't read CSS
// variables): labels sit on the sheet's card color and selection is marked in the text color.
const palettes: Record<"light" | "dark", Palette> = {
    light: {
        root: "#115e59",
        rootRing: "#99f6e4",
        near: "#14b8a6",
        far: "#5eead4",
        missingFill: "#ffffff",
        missingBorder: "#a3a3a3",
        edge: "#a3a3a3",
        edgeHighlight: "#0f766e",
        label: "#0a0a0a",
        labelBackground: "#ffffff",
        selected: "#0a0a0a",
    },
    dark: {
        root: "#5eead4",
        rootRing: "#134e4a",
        near: "#14b8a6",
        far: "#0f766e",
        missingFill: "#171717",
        missingBorder: "#737373",
        edge: "#737373",
        edgeHighlight: "#5eead4",
        label: "#fafafa",
        labelBackground: "#171717",
        selected: "#fafafa",
    },
};

/** Legend swatches use the same colors as the canvas. */
export const getPalette = (theme: string | undefined): Palette => palettes[theme === "dark" ? "dark" : "light"];

export const buildStylesheet = (theme: string | undefined, fontFamily: string): cytoscape.StylesheetJson => {
    const p = getPalette(theme);
    const label = {
        label: "data(label)",
        color: p.label,
        "font-family": fontFamily,
        "font-size": 11,
        "font-weight": 500,
        "text-valign": "bottom",
        "text-halign": "center",
        "text-margin-y": 6,
        "text-wrap": "wrap",
        "text-max-width": "170px",
        "text-background-color": p.labelBackground,
        "text-background-opacity": 0.92,
        "text-background-padding": "3px",
        "text-background-shape": "roundrectangle",
        "min-zoomed-font-size": 7,
    } as const;

    return [
        {
            selector: "node",
            style: {
                width: 16,
                height: 16,
                "background-color": p.near,
                "border-width": 0,
                "overlay-opacity": 0,
                "transition-property": "opacity, background-color, border-color, border-width",
                "transition-duration": 150,
            },
        },
        { selector: "node[depth >= 2]", style: { width: 13, height: 13, "background-color": p.far } },
        {
            selector: 'node[kind = "missing"]',
            style: {
                width: 13,
                height: 13,
                "background-color": p.missingFill,
                "border-width": 1.5,
                "border-style": "dashed",
                "border-color": p.missingBorder,
            },
        },
        {
            selector: 'node[kind = "root"]',
            style: {
                ...label,
                width: 30,
                height: 30,
                "background-color": p.root,
                "border-width": 7,
                "border-color": p.rootRing,
                "border-opacity": 0.9,
                "font-size": 12,
                "font-weight": 600,
                "text-margin-y": 8,
                "text-max-width": "220px",
            },
        },
        // Labels appear on hover/selection only, so the graph stays readable.
        { selector: "node.labeled", style: label },
        {
            selector: "edge",
            style: {
                width: 1.6,
                "line-color": p.edge,
                "curve-style": "straight",
                "target-arrow-shape": "triangle",
                "target-arrow-color": p.edge,
                "arrow-scale": 0.9,
                opacity: 1,
                "transition-property": "opacity, line-color, width",
                "transition-duration": 150,
            },
        },
        { selector: ".faded", style: { opacity: 0.15 } },
        { selector: "node.faded", style: { label: "" } },
        {
            selector: "edge.highlighted",
            style: { width: 2.6, "line-color": p.edgeHighlight, "target-arrow-color": p.edgeHighlight, "arrow-scale": 1.1, opacity: 1, "z-index": 10 },
        },
        { selector: "node.highlighted", style: { "z-index": 10 } },
        {
            selector: "node:selected",
            style: { ...label, "border-width": 3, "border-style": "solid", "border-color": p.selected, "z-index": 20 },
        },
        {
            selector: 'node[kind = "root"]:selected',
            style: { "border-width": 7, "border-color": p.selected },
        },
    ];
};

export const buildLayout = (name: GraphLayoutName, maxDepth: number): cytoscape.LayoutOptions => {
    const common = { animate: true, animationDuration: 450, animationEasing: "ease-out-cubic", fit: true, padding: 36 } as const;
    switch (name) {
        case "concentric":
            // Rings by citation distance: the reference in the middle, each further hop one ring out.
            return {
                ...common,
                name: "concentric",
                concentric: (node: cytoscape.NodeSingular) => maxDepth + 1 - (node.data("depth") as number),
                levelWidth: () => 1,
                minNodeSpacing: 26,
                spacingFactor: 1.1,
                startAngle: (3 / 2) * Math.PI,
                avoidOverlap: true,
            } as cytoscape.LayoutOptions;
        case "breadthfirst":
            return { ...common, name: "breadthfirst", directed: true, roots: '[kind = "root"]', spacingFactor: 1.15, avoidOverlap: true } as cytoscape.LayoutOptions;
        case "cose":
            return { ...common, name: "cose", randomize: false, nodeRepulsion: () => 9000, idealEdgeLength: () => 70, nodeOverlap: 12 } as cytoscape.LayoutOptions;
    }
};
