import { cleanArticleMarkdown } from "./articleContent";

export const EXCERPT_LENGTH = 180;

export const markdownToPlainText = (markdown: string): string =>
    markdown
        .replace(/```[\s\S]*?(```|$)/g, " ")
        .replace(/\$\$[\s\S]*?\$\$/g, " ")
        .replace(/!\[[^[\]]*\]\([^()]*\)/g, " ")
        .replace(/\[([^[\]]*)\]\([^()]*\)/g, "$1")
        .replace(/<[^<>]+>/g, " ")
        .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "")
        .replace(/^[ \t]*(?:[-*_][ \t]*){3,}$/gm, " ")
        .replace(/(\*\*|__|\*|_|~~|`)(?=\S)([^\n]*?\S)\1/g, "$2")
        .replace(/\|/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const TRAILING_PUNCTUATION = new Set(" .,;:!?-");

const trimTrailingPunctuation = (text: string): string => {
    let end = text.length;
    while (end > 0 && TRAILING_PUNCTUATION.has(text[end - 1])) end--;
    return text.slice(0, end);
};

export const toExcerpt = (markdown: string, maxLength = EXCERPT_LENGTH): string => {
    const text = markdownToPlainText(cleanArticleMarkdown(markdown).replace(/^ {0,3}#{1,6} [^\n]*$/gm, ""));
    if (text.length <= maxLength) return text;
    const cut = text.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(" ");
    return `${trimTrailingPunctuation(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut)}…`;
};
