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

// The backend rejects the whole save when one reference DOI can't be resolved; only its message says why.
export const toReferenceErrorKey = (error: unknown): ErrorKey | null => {
    if (!CombinedGraphQLErrors.is(error)) return null;
    const message = error.errors[0]?.message ?? "";
    if (message.startsWith("Could not reach the DOI services")) return "referenceLookupUnavailable";
    if (/^(DOI not found|Invalid DOI|DOI has no title)/.test(message)) return "referenceNotFound";
    return null;
};

// The backend answers unknown or expired action links with INTERNAL_ERROR (backend issue 14); only the message says why.
export const isActionLinkGone = (error: unknown): boolean =>
    getGraphqlClassification(error) === "NOT_FOUND" ||
    (CombinedGraphQLErrors.is(error) &&
        error.errors.some((graphqlError) => /^(Invalid action id|Request has expired)/.test(graphqlError.message)));

export const isEmailTakenError =(error: unknown): boolean =>
    getGraphqlClassification(error) === "BAD_REQUEST" &&
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((graphqlError) => graphqlError.message.includes("already taken"));

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
