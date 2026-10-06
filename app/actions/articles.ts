"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { toErrorKey } from "@/lib/graphqlErrors";
import { authedMutate, getAccessToken } from "@/lib/server/session";
import { ADD_ARTICLE_MUTATION } from "@/services/graphql/articles";
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

    revalidatePath("/articles");
    revalidatePath("/all-articles/[page]", "page");
    // redirect() throws, so it must stay outside the try/catch above.
    redirect(`/articles/${articleId}`);
}
