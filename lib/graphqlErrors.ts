import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";

import type { ErrorKey } from "@/types/errors";

export const SESSION_EXPIRED_PATH = "/session-expired";

export const getGraphqlClassification = (error: unknown): string | null => {
    if (!CombinedGraphQLErrors.is(error)) return null;
    const classification = error.errors[0]?.extensions?.classification;
    return typeof classification === "string" ? classification : null;
};

/** NOT_FOUND, or BAD_REQUEST from the backend's article-id format validator. */
export const isNotFoundError = (error: unknown): boolean => {
    const classification = getGraphqlClassification(error);
    return classification === "NOT_FOUND" || classification === "BAD_REQUEST";
};

export const isAuthRejected = (error: unknown): boolean =>
    (ServerError.is(error) && (error.statusCode === 401 || error.statusCode === 403)) ||
    getGraphqlClassification(error) === "UNAUTHORIZED";

export const toErrorKey = (error: unknown, fallback: ErrorKey): ErrorKey => {
    if (isAuthRejected(error)) return "sessionExpired";
    switch (getGraphqlClassification(error)) {
        case "FORBIDDEN":
            return "forbidden";
        case "NOT_FOUND":
            return "notFound";
        default:
            return fallback;
    }
};
