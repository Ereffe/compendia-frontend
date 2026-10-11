import { afterEach, describe, expect, it, vi } from "vitest";

import {
    createHandleImageFiles,
    insertAtSelection,
    resolveUploadPlaceholder,
    stripUploadPlaceholders,
    uploadPlaceholder,
} from "./editorImagesController";

const uploadImageAction = vi.fn();

vi.mock("@/app/actions/assets", () => ({
    uploadImageAction: (...args: unknown[]) => uploadImageAction(...args),
}));

const ASSET_ID = "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b";

afterEach(() => {
    vi.clearAllMocks();
});

describe("upload placeholders", () => {
    it("inserts at the selection, replacing selected text", () => {
        expect(insertAtSelection("Ala ma kota", 4, 6, "X")).toBe("Ala X kota");
        expect(insertAtSelection("abc", 3, 3, "!")).toBe("abc!");
    });

    it("swaps a placeholder for the final link or removes it", () => {
        const content = `Tekst ${uploadPlaceholder("wykres", "k1")} dalej ${uploadPlaceholder("foto", "k2")}`;

        expect(resolveUploadPlaceholder(content, "k1", "/img/1")).toBe(`Tekst ![wykres](/img/1) dalej ${uploadPlaceholder("foto", "k2")}`);
        expect(resolveUploadPlaceholder(content, "k2", null)).toBe(`Tekst ${uploadPlaceholder("wykres", "k1")} dalej `);
        expect(resolveUploadPlaceholder("deleted by the user", "k1", "/img/1")).toBe("deleted by the user");
    });

    it("strips leftover placeholders, e.g. from a restored draft", () => {
        expect(stripUploadPlaceholders(`A ${uploadPlaceholder("x", "abc123")} B ![ok](/img.png)`)).toBe("A  B ![ok](/img.png)");
    });
});

describe("createHandleImageFiles", () => {
    const setup = (content: string, selection = { start: content.length, end: content.length }) => {
        const state = { content, pending: 0, error: null as string | null };
        let key = 0;
        const handle = createHandleImageFiles({
            defaultAlt: "obraz",
            getSelection: () => selection,
            setContent: (update) => {
                state.content = typeof update === "function" ? update(state.content) : update;
            },
            setPendingUploads: (update) => {
                state.pending = typeof update === "function" ? update(state.pending) : update;
            },
            setImageError: (update) => {
                state.error = typeof update === "function" ? update(state.error as never) : update;
            },
            createKey: () => `k${++key}`,
        });
        return { state, handle };
    };

    const png = (name = "wykres.png") => new File(["x"], name, { type: "image/png" });

    it("shows a placeholder at the cursor while uploading, then the asset link", async () => {
        let finish: (value: unknown) => void = () => {};
        uploadImageAction.mockReturnValue(new Promise((resolve) => (finish = resolve)));
        const { state, handle } = setup("Przed  po", { start: 6, end: 6 });

        const done = handle([png()]);
        expect(state.content).toBe("Przed ![wykres](compendia-upload:k1) po");
        expect(state.pending).toBe(1);

        finish({ ok: true, data: { assetId: ASSET_ID } });
        await done;
        expect(state.content).toBe(`Przed ![wykres](/api/v1/articles/assets/${ASSET_ID}) po`);
        expect(state.pending).toBe(0);
    });

    it("removes the placeholder and reports the error when an upload fails", async () => {
        uploadImageAction.mockResolvedValue({ ok: false, error: "imageUploadBusy" });
        const { state, handle } = setup("Tekst ");

        await handle([png()]);

        expect(state.content).toBe("Tekst ");
        expect(state.error).toBe("imageUploadBusy");
        expect(state.pending).toBe(0);
    });

    it("skips invalid files but still uploads the valid ones", async () => {
        uploadImageAction.mockResolvedValue({ ok: true, data: { assetId: ASSET_ID } });
        const { state, handle } = setup("");

        await handle([new File(["x"], "a.webp", { type: "image/webp" }), png("image.png")]);

        expect(uploadImageAction).toHaveBeenCalledTimes(1);
        expect(state.content).toBe(`![image](/api/v1/articles/assets/${ASSET_ID})`);
        expect(state.error).toBe("imageInvalidType");
    });
});
