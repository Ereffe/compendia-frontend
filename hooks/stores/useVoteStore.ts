import { create } from "zustand";
import { persist } from "zustand/middleware";

export type VoteType = "positive" | "negative";

// userKey -> commentId -> vote. The backend exposes no "my vote" field, so this local record
// is the only way to show which comments the current user already rated on this device.
type VoteState = Record<string, Record<string, VoteType>>;

interface VoteStore {
    votes: VoteState;
    setVote: (userKey: string, commentId: string, voteType: VoteType) => void;
    clearVote: (userKey: string, commentId: string) => void;
    getVote: (userKey: string, commentId: string) => VoteType | undefined;
}

export const useVoteStore = create<VoteStore>()(
    persist(
        (set, get) => ({
            votes: {},
            setVote: (userKey, commentId, voteType) => {
                set((state) => ({
                    votes: {
                        ...state.votes,
                        [userKey]: {
                            ...state.votes[userKey],
                            [commentId]: voteType,
                        },
                    },
                }));
            },
            clearVote: (userKey, commentId) => {
                set((state) => {
                    const userVotes = { ...state.votes[userKey] };
                    delete userVotes[commentId];
                    return {
                        votes: {
                            ...state.votes,
                            [userKey]: userVotes,
                        },
                    };
                });
            },
            getVote: (userKey, commentId) => get().votes[userKey]?.[commentId],
        }),
        {
            name: "vote-store",
            // v0 was keyed by article and shared by every account on the device. It can't be
            // attributed to a user, so drop it.
            version: 1,
            migrate: () => ({ votes: {} }),
        }
    )
);
