import type { Dispatch, SetStateAction } from "react";

import { rateArticleAction } from "@/app/actions/articles";
import { articleVoteId, type VoteType } from "@/hooks/stores/useVoteStore";
import type { ArticleRating } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

export const applyArticleVote = (rating: ArticleRating, voteType: VoteType, delta: 1 | -1): ArticleRating => ({
    ...rating,
    [voteType]: rating[voteType] + delta,
});

type CreateRateArticleHandlerParams = {
    articleId: string;
    userKey: string | null;
    getVote: (userKey: string, itemId: string) => VoteType | undefined;
    setVote: (userKey: string, itemId: string, voteType: VoteType) => void;
    clearVote: (userKey: string, itemId: string) => void;
    setRating: Dispatch<SetStateAction<ArticleRating>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
};

export const createRateArticleHandler = ({
    articleId,
    userKey,
    getVote,
    setVote,
    clearVote,
    setRating,
    setError,
}: CreateRateArticleHandlerParams) => async (positive: boolean) => {
    if (!userKey) {
        setError("voteRequiresLogin");
        return;
    }

    const voteId = articleVoteId(articleId);
    if (getVote(userKey, voteId)) return;

    const voteType: VoteType = positive ? "positive" : "negative";
    setVote(userKey, voteId, voteType);
    setRating((rating) => applyArticleVote(rating, voteType, 1));
    setError(null);

    const result = await rateArticleAction(articleId, positive).catch(() => null);
    if (!result?.ok) {
        clearVote(userKey, voteId);
        setRating((rating) => applyArticleVote(rating, voteType, -1));
        setError(result ? result.error : "rateArticleFailed");
    }
};
