import type { z } from "zod";

import type { ErrorKey } from "@/types/errors";

const errorKeys = new Set<string>();

export const err = (key: ErrorKey) => {
    errorKeys.add(key);
    return { error: key };
};

const toErrorKey = (error: z.ZodError, fallback: ErrorKey): ErrorKey => {
    const message = error.issues[0]?.message;
    return message && errorKeys.has(message) ? (message as ErrorKey) : fallback;
};

export type Parsed<T> = { ok: true; data: T } | { ok: false; error: ErrorKey };

export const parseInput = <S extends z.ZodType>(schema: S, input: unknown, fallback: ErrorKey): Parsed<z.output<S>> => {
    const result = schema.safeParse(input);
    return result.success ? { ok: true, data: result.data } : { ok: false, error: toErrorKey(result.error, fallback) };
};

export const firstError = <S extends z.ZodType>(schema: S, input: unknown, fallback: ErrorKey): ErrorKey | null => {
    const result = parseInput(schema, input, fallback);
    return result.ok ? null : result.error;
};
