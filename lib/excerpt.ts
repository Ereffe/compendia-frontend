import { cleanArticleMarkdown } from "./articleContent";

export const EXCERPT_LENGTH = 180;

export const markdownToPlainText = (markdown: string): string =>
    markdown
        .replace(/```[\s\S]*?(```|$)/g, " ")
        .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
        .replace(/<[^>]+>/g, " ")
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
        .replace(/^\s*([-*_]\s*){3,}$/gm, " ")
        .replace(/(\*\*|__|\*|_|~~|`)(?=\S)([^\n]*?\S)\1/g, "$2")
        .replace(/\|/g, " ")
        .replace(/\s+/g, " ")
        .trim();

export const toExcerpt = (markdown: string, maxLength = EXCERPT_LENGTH): string => {
    const text = markdownToPlainText(cleanArticleMarkdown(markdown));
    if (text.length <= maxLength) return text;
    const cut = text.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s.,;:!?-]+$/, "")}…`;
};
