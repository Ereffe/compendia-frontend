import type { Dispatch, SetStateAction } from "react";

import { rateArticleAction } from "@/app/actions/articles";
import { applyVote, toggledVote, type Vote } from "@/lib/votes";
import type { ArticleRating } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

type CreateRateArticleHandlerParams = {
    articleId: string;
    canVote: boolean;
    vote: Vote;
    setVote: Dispatch<SetStateAction<Vote>>;
    setRating: Dispatch<SetStateAction<ArticleRating>>;
    setPending: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
    onRated?: (vote: Vote) => void;
};

export const createRateArticleHandler = ({
    articleId,
    canVote,
    vote,
    setVote,
    setRating,
    setPending,
    setError,
    onRated,
}: CreateRateArticleHandlerParams) => async (positive: boolean) => {
    if (!canVote) {
        setError("voteRequiresLogin");
        return;
    }

    const next = toggledVote(vote, positive);
    setVote(next);
    setRating((rating) => applyVote(rating, vote, next));
    setPending(true);
    setError(null);

    const result = await rateArticleAction(articleId, next).catch(() => null);
    setPending(false);
    if (!result?.ok) {
        setVote(vote);
        setRating((rating) => applyVote(rating, next, vote));
        setError(result ? result.error : "rateArticleFailed");
        return;
    }
    onRated?.(next);
};
