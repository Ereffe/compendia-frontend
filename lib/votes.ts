import { z } from "zod";

export type Vote = boolean | null;

export const voteSchema = z.boolean().nullable();

export const toggledVote = (current: Vote, positive: boolean): Vote => (current === positive ? null : positive);

export const applyVote = <R extends { positive: number; negative: number }>(rating: R, from: Vote, to: Vote): R => ({
    ...rating,
    positive: rating.positive - Number(from === true) + Number(to === true),
    negative: rating.negative - Number(from === false) + Number(to === false),
});
