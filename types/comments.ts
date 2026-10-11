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
    myVote: boolean | null;
    replies?: CommentItem[];
};

export type EditedComment = {
    id: string;
    content: string;
    editedAt: string | null;
};
