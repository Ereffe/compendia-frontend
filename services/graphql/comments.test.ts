import { describe, expect, it } from "vitest";

import { mapGraphqlCommentToCommentItem } from "./comments";

describe("mapGraphqlCommentToCommentItem", () => {
    it("keeps the parent comment id for replies", () => {
        const reply = mapGraphqlCommentToCommentItem({
            id: "c2",
            content: "Reply",
            datePosted: "2026-05-21T10:00:00.000Z",
            editedAt: null,
            user: {
                id: "u2",
                name: "Olek",
            },
            rating: {
                positive: 3,
                negative: 0,
            },
            parentComment: {
                id: "c1",
            },
        });

        expect(reply.parentCommentId).toBe("c1");
    });
});