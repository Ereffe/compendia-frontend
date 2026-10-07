import type { ArticleComplexity } from "@/types/articles";

import { COMPLEXITY_OPTIONS } from "./articleCreateFormController";

export type ArticleDraft = {
    scientific: boolean;
    title: string;
    content: string;
    references: string[];
    complexity: ArticleComplexity;
    savedAt: string;
};

export const DRAFT_SAVE_DELAY_MS = 800;

const DRAFT_KEY_PREFIX = "compendia:article-draft:";

export const getDraftKey = (userKey: string | null): string | null => (userKey ? `${DRAFT_KEY_PREFIX}${userKey}` : null);

export const isDraftEmpty = (draft: Pick<ArticleDraft, "title" | "content" | "references">): boolean =>
    !draft.title.trim() && !draft.content.trim() && draft.references.length === 0;

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string");

const readDraftReferences = (draft: Record<string, unknown>): string[] | null => {
    if (isStringArray(draft.references)) return draft.references;
    if (typeof draft.doi === "string") return draft.doi.trim() ? [draft.doi.trim()] : [];
    return null;
};

export const parseDraft = (raw: string | null): ArticleDraft | null => {
    if (!raw) return null;
    try {
        const value: unknown = JSON.parse(raw);
        if (typeof value !== "object" || value === null) return null;
        const draft = value as Record<string, unknown>;
        const references = readDraftReferences(draft);
        const isValid =
            typeof draft.scientific === "boolean" &&
            typeof draft.title === "string" &&
            typeof draft.content === "string" &&
            references !== null &&
            typeof draft.savedAt === "string" &&
            COMPLEXITY_OPTIONS.includes(draft.complexity as ArticleComplexity);
        if (!isValid) return null;
        const parsed: ArticleDraft = {
            scientific: draft.scientific as boolean,
            title: draft.title as string,
            content: draft.content as string,
            references,
            complexity: draft.complexity as ArticleComplexity,
            savedAt: draft.savedAt as string,
        };
        return isDraftEmpty(parsed) ? null : parsed;
    } catch {
        return null;
    }
};

const readRaw = (key: string): string | null => {
    try {
        return globalThis.localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const writeDraft = (key: string, draft: ArticleDraft): boolean => {
    try {
        globalThis.localStorage.setItem(key, JSON.stringify(draft));
        return true;
    } catch {
        return false;
    }
};

export const clearDraft = (key: string | null) => {
    if (!key) return;
    try {
        globalThis.localStorage.removeItem(key);
    } catch {}
};

// The draft found when the form opened, cached so autosaves don't turn into a "restore" offer.
const initialDrafts = new Map<string, string | null>();

export const getInitialDraftRaw = (key: string | null): string | null => {
    if (!key) return null;
    if (!initialDrafts.has(key)) initialDrafts.set(key, readRaw(key));
    return initialDrafts.get(key) ?? null;
};

export const forgetInitialDraft = (key: string | null) => {
    if (key) initialDrafts.delete(key);
};

export const subscribeToNothing = () => () => {};
