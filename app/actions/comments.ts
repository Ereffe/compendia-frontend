"use server";

import { unstable_rethrow } from "next/navigation";

import { toErrorKey } from "@/lib/graphqlErrors";
import { authedMutate, getAccessToken } from "@/lib/server/session";
import {
    ADD_COMMENT_MUTATION,
    DELETE_COMMENT_MUTATION,
    EDIT_COMMENT_MUTATION,
    type GraphqlCommentItem,
    mapGraphqlCommentToCommentItem,
    RATE_COMMENT_MUTATION,
} from "@/services/graphql/comments";
import type { ActionResult } from "@/types/articles";
import type { CommentItem, EditedComment } from "@/types/comments";

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
        unstable_rethrow(error);
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

export async function editCommentAction(commentId: string, content: string): Promise<ActionResult<EditedComment>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const trimmedContent = content.trim();
    if (!trimmedContent) return { ok: false, error: "emptyComment" };

    try {
        const data = await authedMutate<{ editComment: EditedComment }>(accessToken, EDIT_COMMENT_MUTATION, {
            commentId: Number.parseInt(commentId, 10),
            newContent: trimmedContent,
        });
        return { ok: true, data: data.editComment };
    } catch (error) {
        unstable_rethrow(error);
        console.error("editCommentAction failed:", error);
        return { ok: false, error: toErrorKey(error, "editCommentFailed") };
    }
}

export async function deleteCommentAction(commentId: string): Promise<ActionResult<null>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    try {
        const data = await authedMutate<{ deleteComment: boolean }>(accessToken, DELETE_COMMENT_MUTATION, {
            commentId: Number.parseInt(commentId, 10),
        });
        if (!data.deleteComment) return { ok: false, error: "deleteCommentFailed" };
        return { ok: true, data: null };
    } catch (error) {
        unstable_rethrow(error);
        console.error("deleteCommentAction failed:", error);
        return { ok: false, error: toErrorKey(error, "deleteCommentFailed") };
    }
}
