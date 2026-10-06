"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { isValidArticleId } from "@/lib/articleId";
import { withNotice } from "@/lib/notices";
import { toErrorKey } from "@/lib/graphqlErrors";
import { authedMutate, getAccessToken } from "@/lib/server/session";
import {
    ADD_ARTICLE_MUTATION,
    DELETE_ARTICLE_MUTATION,
    EDIT_ARTICLE_MUTATION,
    RATE_ARTICLE_MUTATION,
} from "@/services/graphql/articles";
import type { ActionError, ActionResult, ArticleComplexity } from "@/types/articles";

const COMPLEXITIES = new Set<string>(["SIMPLE", "INTERMEDIATE", "COMPLEX"]);

export type CreateArticleInput = {
    title: string;
    content: string;
    complexity: ArticleComplexity;
    references: string[];
};

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
        const data = await authedMutate(accessToken, ADD_ARTICLE_MUTATION, {
            title,
            content,
            complexity: input.complexity,
            references: references.length > 0 ? references : null,
        });
        articleId = data.addArticle.id;
    } catch (error) {
        unstable_rethrow(error);
        console.error("createArticleAction failed:", error);
        return { ok: false, error: toErrorKey(error, "createArticleFailed") };
    }

    revalidateArticleLists();
    // redirect() throws, so it must stay outside the try/catch above.
    redirect(withNotice(`/articles/${articleId}`, "articleCreated"));
}

const revalidateArticleLists = () => {
    revalidatePath("/articles");
    revalidatePath("/all-articles/[page]", "page");
};

export type EditArticleInput = {
    title: string;
    content: string;
    complexity: ArticleComplexity;
    references: string[] | null;
};

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
        await authedMutate(accessToken, EDIT_ARTICLE_MUTATION, {
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
    redirect(withNotice(`/articles/${articleId}`, "articleSaved"));
}

export async function deleteArticleAction(articleId: string): Promise<ActionError> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };
    if (!isValidArticleId(articleId)) return { ok: false, error: "notFound" };

    try {
        const data = await authedMutate(accessToken, DELETE_ARTICLE_MUTATION, { articleId });
        if (!data.deleteArticle) return { ok: false, error: "deleteArticleFailed" };
    } catch (error) {
        unstable_rethrow(error);
        console.error("deleteArticleAction failed:", error);
        return { ok: false, error: toErrorKey(error, "deleteArticleFailed") };
    }

    revalidatePath(`/articles/${articleId}`);
    revalidateArticleLists();
    redirect(withNotice("/articles", "articleDeleted"));
}

export async function rateArticleAction(articleId: string, positive: boolean): Promise<ActionResult<null>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };
    if (!isValidArticleId(articleId)) return { ok: false, error: "notFound" };

    try {
        await authedMutate(accessToken, RATE_ARTICLE_MUTATION, { articleId, positive });
        return { ok: true, data: null };
    } catch (error) {
        unstable_rethrow(error);
        console.error("rateArticleAction failed:", error);
        return { ok: false, error: toErrorKey(error, "rateArticleFailed") };
    }
}
