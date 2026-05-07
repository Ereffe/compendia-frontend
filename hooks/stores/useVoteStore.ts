import { create } from "zustand";
import { persist } from "zustand/middleware";

type VoteState = Record<string, Record<string, "positive" | "negative">>;

interface VoteStore {
    votes: VoteState;
    setVote: (articleId: string, commentId: string, voteType: "positive" | "negative") => void;
    clearVote: (articleId: string, commentId: string) => void;
    clearArticleVotes: (articleId: string) => void;
    getVote: (articleId: string, commentId: string) => "positive" | "negative" | undefined;
}

export const useVoteStore = create<VoteStore>()(
    persist(
        (set, get) => ({
            votes: {},
            setVote: (articleId, commentId, voteType) => {
                set((state) => ({
                    votes: {
                        ...state.votes,
                        [articleId]: {
                            ...state.votes[articleId],
                            [commentId]: voteType,
                        },
                    },
                }));
            },
            clearVote: (articleId, commentId) => {
                set((state) => {
                    const articleVotes = { ...state.votes[articleId] };
                    delete articleVotes[commentId];
                    return {
                        votes: {
                            ...state.votes,
                            [articleId]: articleVotes,
                        },
                    };
                });
            },
            clearArticleVotes: (articleId) => {
                set((state) => {
                    const { [articleId]: _, ...rest } = state.votes;
                    return { votes: rest };
                });
            },
            getVote: (articleId, commentId) => {
                return get().votes[articleId]?.[commentId];
            },
        }),
        {
            name: "vote-store",
        }
    )
);
