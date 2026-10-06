"use server";

import { unstable_rethrow } from "next/navigation";

import { toErrorKey } from "@/lib/graphqlErrors";
import { authedMutate, getAccessToken } from "@/lib/server/session";
import {
    ADD_COMMENT_MUTATION,
    type GraphqlCommentItem,
    mapGraphqlCommentToCommentItem,
    RATE_COMMENT_MUTATION,
} from "@/services/graphql/comments";
import type { ActionResult } from "@/types/articles";
import type { CommentItem } from "@/types/comments";

// Server Actions return errors as values: thrown errors are masked in production builds.

export async function addCommentAction(
    articleId: string,
    content: string,
    parentCommentId: string | null = null,
): Promise<ActionResult<CommentItem>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const trimmedContent = content.trim();
    if (!trimmedContent) return { ok: false, error: "emptyComment" };

    try {
        const data = await authedMutate<{ addComment: GraphqlCommentItem }>(accessToken, ADD_COMMENT_MUTATION, {
            articleId,
            content: trimmedContent,
            parentCommentId: parentCommentId ? Number.parseInt(parentCommentId, 10) : null,
        });
        return { ok: true, data: mapGraphqlCommentToCommentItem(data.addComment) };
    } catch (error) {
        unstable_rethrow(error); // session-expired redirect from authedMutate
        console.error("addCommentAction failed:", error);
        return { ok: false, error: toErrorKey(error, "addCommentFailed") };
    }
}

export async function rateCommentAction(commentId: string, positive: boolean): Promise<ActionResult<null>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    try {
        await authedMutate<{ rateComment: number }>(accessToken, RATE_COMMENT_MUTATION, {
            commentId: Number.parseInt(commentId, 10),
            positive,
        });
        return { ok: true, data: null };
    } catch (error) {
        unstable_rethrow(error);
        console.error("rateCommentAction failed:", error);
        return { ok: false, error: toErrorKey(error, "rateCommentFailed") };
    }
}
