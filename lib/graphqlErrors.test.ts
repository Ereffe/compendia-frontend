import { CombinedGraphQLErrors, ServerError } from "@apollo/client/errors";
import { describe, expect, it } from "vitest";

import { isAuthRejected, isDetachedAuthorError, isNotFoundError, toErrorKey } from "./graphqlErrors";

const serverError = (status: number) =>
    new ServerError("Response not successful", {
        response: new Response("", { status }),
        bodyText: "",
    });

const graphqlError = (classification: string) =>
    new CombinedGraphQLErrors({ errors: [{ message: "x", extensions: { classification } }] });

describe("isAuthRejected", () => {
    it.each([401, 403])("treats HTTP %i as a rejected token", (status) => {
        expect(isAuthRejected(serverError(status))).toBe(true);
    });

    it("treats an UNAUTHORIZED GraphQL error as a rejected token", () => {
        expect(isAuthRejected(graphqlError("UNAUTHORIZED"))).toBe(true);
    });

    it.each([
        ["HTTP 500", serverError(500)],
        ["FORBIDDEN (resource permission, not the session)", graphqlError("FORBIDDEN")],
        ["NOT_FOUND", graphqlError("NOT_FOUND")],
        ["a plain Error", new Error("network")],
    ])("does not treat %s as a rejected token", (_label, error) => {
        expect(isAuthRejected(error)).toBe(false);
    });
});

describe("toErrorKey", () => {
    it("maps backend errors to translation keys", () => {
        expect(toErrorKey(serverError(403), "addCommentFailed")).toBe("sessionExpired");
        expect(toErrorKey(graphqlError("FORBIDDEN"), "addCommentFailed")).toBe("forbidden");
        expect(toErrorKey(graphqlError("NOT_FOUND"), "addCommentFailed")).toBe("notFound");
        expect(toErrorKey(new Error("boom"), "addCommentFailed")).toBe("addCommentFailed");
    });
});

describe("isNotFoundError", () => {
    it("accepts NOT_FOUND and BAD_REQUEST only", () => {
        expect(isNotFoundError(graphqlError("NOT_FOUND"))).toBe(true);
        expect(isNotFoundError(graphqlError("BAD_REQUEST"))).toBe(true);
        expect(isNotFoundError(graphqlError("INTERNAL_ERROR"))).toBe(false);
        expect(isNotFoundError(serverError(404))).toBe(false);
    });
});

describe("isDetachedAuthorError", () => {
    const withMessage = (message: string) =>
        new CombinedGraphQLErrors({ errors: [{ message, extensions: { classification: "INTERNAL_ERROR" } }] });

    it("recognizes the backend's unloaded author proxy", () => {
        expect(
            isDetachedAuthorError(withMessage("Could not initialize proxy [org.compedia.users.entities.User#cb33] - no session")),
        ).toBe(true);
    });

    it("ignores other errors", () => {
        expect(isDetachedAuthorError(withMessage("Something else"))).toBe(false);
        expect(isDetachedAuthorError(new Error("Could not initialize proxy [org.compedia.users.entities.User#x]"))).toBe(false);
    });
});
