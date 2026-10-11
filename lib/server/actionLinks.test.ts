// @vitest-environment node
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { describe, expect, it, vi } from "vitest";

import { isActionLinkValid } from "./actionLinks";

const query = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/apollo", () => ({ getServerClient: () => ({ query }) }));

const ACTION_ID = "aBcDeFgHiJkLmNoPqRsTuVwXy";

describe("isActionLinkValid", () => {
    it("accepts a pending request of the expected type", async () => {
        query.mockResolvedValueOnce({ data: { getActionDetails: { type: "CHANGE_PASSWORD" } } });
        await expect(isActionLinkValid(ACTION_ID, "CHANGE_PASSWORD")).resolves.toBe(true);
    });

    it("rejects a link for the other action", async () => {
        query.mockResolvedValueOnce({ data: { getActionDetails: { type: "CHANGE_EMAIL" } } });
        await expect(isActionLinkValid(ACTION_ID, "CHANGE_PASSWORD")).resolves.toBe(false);
    });

    it("rejects an expired or used link without failing the page", async () => {
        query.mockRejectedValueOnce(
            new CombinedGraphQLErrors({ errors: [{ message: "Request has expired", extensions: { classification: "NOT_FOUND" } }] }),
        );
        await expect(isActionLinkValid(ACTION_ID, "CHANGE_EMAIL")).resolves.toBe(false);
    });

    it("rejects an unknown link, which the backend reports as INTERNAL_ERROR", async () => {
        query.mockRejectedValueOnce(
            new CombinedGraphQLErrors({
                errors: [{ message: "Invalid action id. Request doesn't exist", extensions: { classification: "INTERNAL_ERROR" } }],
            }),
        );
        await expect(isActionLinkValid(ACTION_ID, "CHANGE_EMAIL")).resolves.toBe(false);
    });

    it("skips the backend for a malformed id and rethrows other failures", async () => {
        query.mockClear();
        await expect(isActionLinkValid("../etc", "CHANGE_EMAIL")).resolves.toBe(false);
        expect(query).not.toHaveBeenCalled();

        query.mockRejectedValueOnce(new Error("backend down"));
        await expect(isActionLinkValid(ACTION_ID, "CHANGE_EMAIL")).rejects.toThrow("backend down");
    });
});
