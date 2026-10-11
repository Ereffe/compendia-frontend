// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

import { LINK_ASSET_MUTATION } from "@/services/graphql/articles";

import { createArticleAction } from "./articles";

const authedMutate = vi.fn();

vi.mock("@/lib/server/session", () => ({
    getAccessToken: async () => "token",
    authedMutate: (...args: unknown[]) => authedMutate(...args),
}));
vi.mock("next/navigation", () => ({
    redirect: (path: string) => {
        throw new Error(`REDIRECT:${path}`);
    },
    unstable_rethrow: () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const ASSET_ID = "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b";
const PASTED_ID = "1c2d3e4f-0000-4000-8000-000000000001";
const input = {
    title: "Tytuł",
    content: `Tekst\n\n![Wykres](/api/v1/articles/assets/${ASSET_ID})\n\n![Cudzy](/api/v1/articles/assets/${PASTED_ID})`,
    complexity: "SIMPLE" as const,
    references: [],
    uploadedImages: [ASSET_ID],
};

afterEach(() => vi.clearAllMocks());

describe("createArticleAction", () => {
    it("links only the images uploaded in this editor, not pasted links to other images", async () => {
        authedMutate.mockResolvedValueOnce({ addArticle: { id: "Abc123", title: "Tytuł" } }).mockResolvedValue({});

        await expect(createArticleAction(input)).rejects.toThrow("REDIRECT:/articles/Abc123?notice=articleCreated");

        expect(authedMutate).toHaveBeenCalledTimes(2);
        expect(authedMutate).toHaveBeenLastCalledWith("token", LINK_ASSET_MUTATION, {
            id: ASSET_ID,
            name: "Wykres",
            articleId: "Abc123",
        });
    });

    it("still opens the saved article when linking an image fails", async () => {
        vi.spyOn(console, "error").mockImplementation(() => {});
        authedMutate.mockResolvedValueOnce({ addArticle: { id: "Abc123", title: "Tytuł" } }).mockRejectedValue(new Error("down"));

        await expect(createArticleAction(input)).rejects.toThrow("REDIRECT:/articles/Abc123?notice=articleCreated");
    });
});
