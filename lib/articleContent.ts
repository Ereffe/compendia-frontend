import { defaultUrlTransform } from "react-markdown";

const BACKEND_ASSET_PATH = /^\/api\/v1\/articles\/assets\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const ASSET_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ASSET_CONTENT_TYPES = new Set(["image/png", "image/jpeg", "image/gif"]);

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

// The backend's PDF import saves the vision model's chatter as content (backend issue 16).
export const cleanArticleMarkdown = (markdown: string): string => {
    const withoutPreamble = markdown.replace(MODEL_PREAMBLE, "").trim();
    return WHOLE_MARKDOWN_FENCE.exec(withoutPreamble)?.[1].trim() ?? withoutPreamble;
};
