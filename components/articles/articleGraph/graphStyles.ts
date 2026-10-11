import type cytoscape from "cytoscape";

export type GraphLayoutName = "concentric" | "breadthfirst" | "cose";
export const GRAPH_LAYOUTS: GraphLayoutName[] = ["concentric", "breadthfirst", "cose"];

type Palette = {
    root: string;
    near: string;
    far: string;
    missingBorder: string;
    edge: string;
    accent: string;
    label: string;
    paper: string;
};

const palettes: Record<"light" | "dark", Palette> = {
    light: {
        root: "#1f5e96",
        near: "#1c1a17",
        far: "#8a8276",
        missingBorder: "#9c9488",
        edge: "#d6d0c4",
        accent: "#1f5e96",
        label: "#1c1a17",
        paper: "#fffefa",
    },
    dark: {
        root: "#a5d6fe",
        near: "#e9e5dc",
        far: "#8a8276",
        missingBorder: "#7d766b",
        edge: "#4a453d",
        accent: "#a5d6fe",
        label: "#e9e5dc",
        paper: "#24211c",
    },
};

export const getPalette = (theme: string | undefined): Palette => palettes[theme === "dark" ? "dark" : "light"];

export const buildStylesheet = (theme: string | undefined, fontFamily: string): cytoscape.StylesheetJson => {
    const p = getPalette(theme);
    const label = {
        label: "data(label)",
        color: p.label,
        "font-family": fontFamily,
        "font-size": 12,
        "font-style": "italic",
        "font-weight": 400,
        "text-valign": "bottom",
        "text-halign": "center",
        "text-margin-y": 5,
        "text-wrap": "wrap",
        "text-max-width": "180px",
        "text-outline-color": p.paper,
        "text-outline-width": 3,
        "text-outline-opacity": 1,
        "min-zoomed-font-size": 7,
    } as const;

    return [
        {
            selector: "node",
            style: {
                width: 9,
                height: 9,
                "background-color": p.near,
                "border-width": 0,
                "overlay-opacity": 0,
                "transition-property": "opacity, background-color, border-color, border-width",
                "transition-duration": 150,
            },
        },
        { selector: "node[depth >= 2]", style: { width: 7, height: 7, "background-color": p.far } },
        {
            selector: 'node[kind = "missing"]',
            style: {
                width: 8,
                height: 8,
                "background-color": p.paper,
                "border-width": 1,
                "border-style": "solid",
                "border-color": p.missingBorder,
            },
        },
        {
            selector: 'node[kind = "root"]',
            style: {
                width: 18,
                height: 18,
                "background-color": p.root,
                "border-width": 3,
                "border-color": p.paper,
                "underlay-color": p.root,
                "underlay-opacity": 0.18,
                "underlay-padding": 9,
                "underlay-shape": "ellipse",
                "z-index": 5,
            },
        },
        { selector: "node.labeled", style: label },
        {
            selector: 'node[kind = "root"].labeled',
            style: { "font-style": "normal", "font-weight": 500, "text-margin-y": 12, "text-max-width": "240px" },
        },
        {
            selector: "edge",
            style: {
                width: 0.7,
                "line-color": p.edge,
                "curve-style": "straight",
                "target-arrow-shape": "none",
                "target-arrow-color": p.edge,
                "arrow-scale": 0.55,
                opacity: 0.55,
                "transition-property": "opacity, line-color, width",
                "transition-duration": 150,
            },
        },
        { selector: ".faded", style: { opacity: 0.12 } },
        { selector: "node.faded", style: { label: "" } },
        {
            selector: "edge.highlighted",
            style: { width: 1.4, "line-color": p.accent, "target-arrow-shape": "triangle", "target-arrow-color": p.accent, "arrow-scale": 0.75, opacity: 1, "z-index": 10 },
        },
        { selector: "node.highlighted", style: { "z-index": 10 } },
        {
            selector: "node:selected",
            style: { ...label, "border-width": 2, "border-style": "solid", "border-color": p.accent, "z-index": 20 },
        },
        {
            selector: 'node[kind = "root"]:selected',
            style: { "border-width": 3, "border-color": p.accent, "font-style": "normal", "text-margin-y": 12 },
        },
    ];
};

export const buildLayout = (name: GraphLayoutName, radial: ReadonlyMap<string, cytoscape.Position>): cytoscape.LayoutOptions => {
    const common = { animate: true, animationDuration: 450, animationEasing: "ease-out-cubic", fit: true, padding: 36 } as const;
    switch (name) {
        case "concentric":
            return { ...common, name: "preset", positions: (node: cytoscape.NodeSingular) => radial.get(node.id()) ?? { x: 0, y: 0 } } as cytoscape.LayoutOptions;
        case "breadthfirst":
            return { ...common, name: "breadthfirst", directed: true, roots: '[kind = "root"]', spacingFactor: 1.15, avoidOverlap: true } as cytoscape.LayoutOptions;
        case "cose":
            return { ...common, name: "cose", randomize: false, nodeRepulsion: () => 9000, idealEdgeLength: () => 70, nodeOverlap: 12 } as cytoscape.LayoutOptions;
    }
};
