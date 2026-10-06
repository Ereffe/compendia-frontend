"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { isValidArticleId } from "@/lib/articleId";
import { toErrorKey } from "@/lib/graphqlErrors";
import { authedMutate, getAccessToken } from "@/lib/server/session";
import { ADD_ARTICLE_MUTATION, DELETE_ARTICLE_MUTATION, EDIT_ARTICLE_MUTATION } from "@/services/graphql/articles";
import type { ActionError, ArticleComplexity } from "@/types/articles";

const COMPLEXITIES = new Set<string>(["SIMPLE", "INTERMEDIATE", "COMPLEX"]);

export type CreateArticleInput = {
    title: string;
    content: string;
    complexity: ArticleComplexity;
    references: string[];
};

/**
 * Creates the article and redirects to it. It only returns when something went wrong.
 * The redirect happens on the server, so client code must not call router.push/refresh afterwards.
 */
export async function createArticleAction(input: CreateArticleInput): Promise<ActionError> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || !content) return { ok: false, error: "missingTitleOrContent" };
    if (!COMPLEXITIES.has(input.complexity)) return { ok: false, error: "invalidComplexity" };

    const references = input.references.map((doi) => doi.trim()).filter(Boolean);

    let articleId: string;
    try {
        const data = await authedMutate<{ addArticle: { id: string } }>(accessToken, ADD_ARTICLE_MUTATION, {
            title,
            content,
            complexity: input.complexity,
            references: references.length > 0 ? references : null,
        });
        articleId = data.addArticle.id;
    } catch (error) {
        unstable_rethrow(error); // session-expired redirect from authedMutate
        console.error("createArticleAction failed:", error);
        return { ok: false, error: toErrorKey(error, "createArticleFailed") };
    }

    revalidateArticleLists();
    // redirect() throws, so it must stay outside the try/catch above.
    redirect(`/articles/${articleId}`);
}

const revalidateArticleLists = () => {
    revalidatePath("/articles");
    revalidatePath("/all-articles/[page]", "page");
};

export type EditArticleInput = {
    title: string;
    content: string;
    complexity: ArticleComplexity;
    /** New references, or null to keep the current ones (the backend can't clear them). */
    references: string[] | null;
};

/**
 * Saves the author's changes and redirects to the article. It only returns when something went wrong.
 * The backend checks that the caller is the author and answers FORBIDDEN otherwise.
 */
export async function editArticleAction(articleId: string, input: EditArticleInput): Promise<ActionError> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };
    if (!isValidArticleId(articleId)) return { ok: false, error: "notFound" };

    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || !content) return { ok: false, error: "missingTitleOrContent" };
    if (!COMPLEXITIES.has(input.complexity)) return { ok: false, error: "invalidComplexity" };

    const references = input.references?.map((doi) => doi.trim()).filter(Boolean) ?? [];

    try {
        await authedMutate<{ editArticle: { id: string } }>(accessToken, EDIT_ARTICLE_MUTATION, {
            articleId,
            title,
            content,
            complexity: input.complexity,
            references: references.length > 0 ? references : null,
        });
    } catch (error) {
        unstable_rethrow(error);
        console.error("editArticleAction failed:", error);
        return { ok: false, error: toErrorKey(error, "editArticleFailed") };
    }

    revalidatePath(`/articles/${articleId}`);
    revalidateArticleLists();
    redirect(`/articles/${articleId}`);
}

/** Deletes the author's article (with its comments) and redirects to the article list. */
export async function deleteArticleAction(articleId: string): Promise<ActionError> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };
    if (!isValidArticleId(articleId)) return { ok: false, error: "notFound" };

    try {
        const data = await authedMutate<{ deleteArticle: boolean }>(accessToken, DELETE_ARTICLE_MUTATION, { articleId });
        if (!data.deleteArticle) return { ok: false, error: "deleteArticleFailed" };
    } catch (error) {
        unstable_rethrow(error);
        console.error("deleteArticleAction failed:", error);
        return { ok: false, error: toErrorKey(error, "deleteArticleFailed") };
    }

    revalidatePath(`/articles/${articleId}`);
    revalidateArticleLists();
    redirect("/articles");
}
