import type { ElementContent, Root } from "hast";
import { defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

const BACKEND_ASSET_PATH = /^\/api\/v1\/articles\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const ASSET_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ASSET_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/gif"]);

export const mathRemarkPlugins = [remarkMath];

export const articleRemarkPlugins = [remarkGfm, ...mathRemarkPlugins];

export const articleRehypePlugins = [rehypeKatex];

export type ArticleSection = { id: string; title: string };

const textOf = (node: ElementContent): string => {
    if (node.type === "text") return node.value;
    return "children" in node ? node.children.map(textOf).join("") : "";
};

const slugify = (text: string) =>
    text.toLowerCase().normalize("NFKD").replace(/\p{M}/gu, "").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");

export const rehypeArticleSections = (sections: ArticleSection[]) => (tree: Root) => {
    const used = new Set<string>();
    for (const node of tree.children) {
        if (node.type !== "element" || node.tagName !== "h2") continue;
        const title = textOf(node).trim();
        const base = `section-${slugify(title) || sections.length + 1}`;
        let id = base;
        let n = 1;
        while (used.has(id)) id = `${base}-${++n}`;
        used.add(id);
        node.properties.id = id;
        sections.push({ id, title });
    }
};

const ARTICLE_IMAGE =
    /!\[([^\]]*)\]\(\/api\/v1\/articles\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi;

export const articleImages = (markdown: string): { id: string; name: string }[] => {
    const names = new Map<string, string>();
    for (const [, alt, id] of markdown.matchAll(ARTICLE_IMAGE)) {
        if (!names.has(id.toLowerCase())) names.set(id.toLowerCase(), alt.trim().slice(0, 255) || "image");
    }
    return [...names].map(([id, name]) => ({ id, name }));
};

export const assetProxyPath = (assetId: string) => `/api/assets/${assetId}`;

export const backendAssetPath = (assetId: string) => `/api/v1/articles/assets/${assetId}`;

// PDF imports link images as backend-relative paths, which would resolve against this app's origin.
export const articleUrlTransform = (url: string): string => {
    const safeUrl = defaultUrlTransform(url);
    const assetId = BACKEND_ASSET_PATH.exec(safeUrl)?.[1];
    return assetId ? assetProxyPath(assetId) : safeUrl;
};

const MODEL_PREAMBLE =
    /^[ \t]*(?:(?:sure|certainly|of course|okay|ok)[,!.]?[ \t]+)?here(?:'s|’s| is| are)\b[^\n]*markdown[^\n]*:[ \t]*\n(?:[ \t]*\n)*(?:[ \t]*-{3,}[ \t]*\n)?/gim;

const WHOLE_MARKDOWN_FENCE = /^```(?:markdown|md)[ \t]*\n([\s\S]*?)\n```\s*$/i;

// The backend strips the model's preamble since PR #17; this still cleans articles imported before that.
export const cleanArticleMarkdown = (markdown: string): string => {
    const withoutPreamble = markdown.replace(MODEL_PREAMBLE, "").trim();
    return WHOLE_MARKDOWN_FENCE.exec(withoutPreamble)?.[1].trim() ?? withoutPreamble;
};
