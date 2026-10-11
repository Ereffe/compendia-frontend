"use server";

import { unstable_rethrow } from "next/navigation";

import { toErrorKey } from "@/lib/graphqlErrors";
import { addCommentSchema, articleIdSchema, commentIdSchema, editCommentSchema } from "@/lib/schemas";
import { parseInput } from "@/lib/validation";
import { type Vote, voteSchema } from "@/lib/votes";
import { authedMutate, authedQuery, getAccessToken } from "@/lib/server/session";
import { COMMENTS_PAGE_SIZE } from "@/services/graphql/articles";
import {
    ADD_COMMENT_MUTATION,
    ARTICLE_COMMENTS_QUERY,
    DELETE_COMMENT_MUTATION,
    EDIT_COMMENT_MUTATION,
    mapGraphqlCommentToCommentItem,
    RATE_COMMENT_MUTATION,
    UNRATE_COMMENT_MUTATION,
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

    const parsed = parseInput(addCommentSchema, { articleId, content, parentCommentId }, "addCommentFailed");
    if (!parsed.ok) return parsed;

    try {
        const data = await authedMutate(accessToken, ADD_COMMENT_MUTATION, parsed.data);
        return { ok: true, data: mapGraphqlCommentToCommentItem(data.addComment) };
    } catch (error) {
        unstable_rethrow(error);
        console.error("addCommentAction failed:", error);
        return { ok: false, error: toErrorKey(error, "addCommentFailed") };
    }
}

export async function loadCommentsAction(
    articleId: string,
    page: number,
): Promise<ActionResult<{ comments: CommentItem[]; totalElements: number }>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };
    if (!articleIdSchema.safeParse(articleId).success) return { ok: false, error: "notFound" };
    if (!Number.isInteger(page) || page < 1) return { ok: false, error: "loadCommentsFailed" };

    try {
        const data = await authedQuery(accessToken, ARTICLE_COMMENTS_QUERY, { articleId, page, size: COMMENTS_PAGE_SIZE });
        return {
            ok: true,
            data: {
                comments: data.comments.content.map(mapGraphqlCommentToCommentItem),
                totalElements: data.comments.totalElements,
            },
        };
    } catch (error) {
        unstable_rethrow(error);
        console.error("loadCommentsAction failed:", error);
        return { ok: false, error: toErrorKey(error, "loadCommentsFailed") };
    }
}

export async function rateCommentAction(commentId: string, vote: Vote): Promise<ActionResult<null>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const parsedId = parseInput(commentIdSchema, commentId, "rateCommentFailed");
    if (!parsedId.ok) return parsedId;
    if (!voteSchema.safeParse(vote).success) return { ok: false, error: "rateCommentFailed" };

    try {
        if (vote === null) await authedMutate(accessToken, UNRATE_COMMENT_MUTATION, { commentId: parsedId.data });
        else await authedMutate(accessToken, RATE_COMMENT_MUTATION, { commentId: parsedId.data, positive: vote });
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

    const parsed = parseInput(editCommentSchema, { commentId, content }, "editCommentFailed");
    if (!parsed.ok) return parsed;

    try {
        const data = await authedMutate(accessToken, EDIT_COMMENT_MUTATION, {
            commentId: parsed.data.commentId,
            newContent: parsed.data.content,
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

    const parsedId = parseInput(commentIdSchema, commentId, "deleteCommentFailed");
    if (!parsedId.ok) return parsedId;

    try {
        const data = await authedMutate(accessToken, DELETE_COMMENT_MUTATION, { commentId: parsedId.data });
        if (!data.deleteComment) return { ok: false, error: "deleteCommentFailed" };
        return { ok: true, data: null };
    } catch (error) {
        unstable_rethrow(error);
        console.error("deleteCommentAction failed:", error);
        return { ok: false, error: toErrorKey(error, "deleteCommentFailed") };
    }
}
