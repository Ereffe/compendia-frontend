export type CommentItem = {
    id: string;
    content: string;
    datePosted: string;
    editedAt?: string | null;
    user: {
        id: string;
        name: string;
    };
    rating: {
        positive: number;
        negative: number;
    };
};
