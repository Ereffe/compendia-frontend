export type CommentItem = {
    id: string;
    content: string;
    datePosted: string;
    editedAt?: string | null;
    parentCommentId?: string | null;
    user: {
        id: string;
        name: string;
    };
    rating: {
        positive: number;
        negative: number;
    };
    replies?: CommentItem[];
};

/** What `editComment` returns: only the fields an edit changes. */
export type EditedComment = {
    id: string;
    content: string;
    editedAt: string | null;
};
