import type { ArticleAuthorsQuery } from "@/services/graphql/generated/graphql";
import { userIdSchema } from "./schemas";

type Author = NonNullable<ArticleAuthorsQuery["articles"]["content"][number]["author"]>;

export type AuthorResult = Author & { articleCount: number };

// shortcut: the backend has no user search or author filter, so users are found through all their articles; upgrade when it adds `users(search:)` (backend-feature-requests.md).
export const ALL_ARTICLES_SIZE = 1000;

export const isValidUserId = (id: string): boolean => userIdSchema.safeParse(id).success;

export const findAuthors = (authors: readonly (Author | null | undefined)[], query: string): AuthorResult[] => {
    const needle = query.trim().toLocaleLowerCase();
    const found = new Map<string, AuthorResult>();
    for (const author of authors) {
        if (!author?.name.toLocaleLowerCase().includes(needle)) continue;
        found.set(author.id, { ...author, articleCount: (found.get(author.id)?.articleCount ?? 0) + 1 });
    }
    return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
};
