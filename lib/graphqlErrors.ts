import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";

import type { ErrorKey } from "@/types/errors";

/** Where to send the user when the backend rejects their token (see app/session-expired/route.ts). */
export const SESSION_EXPIRED_PATH = "/session-expired";

/** Spring GraphQL puts the error type (NOT_FOUND, BAD_REQUEST, FORBIDDEN, ...) in `extensions.classification`. */
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

/**
 * The backend refused the user's token. `/graphql` itself allows anonymous access, so an HTTP 401/403
 * only happens when authentication fails, e.g. the token's user no longer exists (the backend's JWT
 * filter crashes and Spring answers 403) or the token was signed with another secret.
 */
export const isAuthRejected = (error: unknown): boolean =>
    (ServerError.is(error) && (error.statusCode === 401 || error.statusCode === 403)) ||
    getGraphqlClassification(error) === "UNAUTHORIZED";

/** Maps a backend error to a key of the `errors` translation namespace. */
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
