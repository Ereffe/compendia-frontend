// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { uploadImageAction } from "./assets";

const getAccessToken = vi.fn();
const redirect = vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/server/session", () => ({ getAccessToken: () => getAccessToken() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => redirect(path) }));
vi.mock("@/lib/config", () => ({ serverBackendUrl: "https://backend" }));

const ASSET_ID = "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b";
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3];
const fetchMock = vi.fn();

const imageForm = (file: File) => {
    const formData = new FormData();
    formData.append("image", file);
    return formData;
};

const png = () => new File([new Uint8Array(PNG_BYTES)], "wykres.png", { type: "image/png" });

beforeEach(() => {
    getAccessToken.mockResolvedValue("token");
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe("uploadImageAction", () => {
    it("uploads the image as the backend's multipart file and returns the asset id", async () => {
        fetchMock.mockResolvedValue(new Response(ASSET_ID, { status: 200 }));

        await expect(uploadImageAction(imageForm(png()))).resolves.toEqual({ ok: true, data: { assetId: ASSET_ID } });

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("https://backend/api/v1/articles/assets");
        expect(init.headers).toEqual({ Authorization: "Bearer token" });
        const file = (init.body as FormData).get("file") as File;
        expect(file.name).toBe("image.png");
        expect(file.type).toBe("image/png");
        expect([...new Uint8Array(await file.arrayBuffer())]).toEqual(PNG_BYTES);
    });

    it("rejects files that aren't really the declared image type", async () => {
        const fake = new File(["<script>alert(1)</script>"], "x.png", { type: "image/png" });

        await expect(uploadImageAction(imageForm(fake))).resolves.toEqual({ ok: false, error: "imageInvalidType" });
        await expect(
            uploadImageAction(imageForm(new File(["<svg/>"], "x.svg", { type: "image/svg+xml" }))),
        ).resolves.toEqual({ ok: false, error: "imageInvalidType" });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("maps backend failures and unexpected answers", async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
        await expect(uploadImageAction(imageForm(png()))).resolves.toEqual({ ok: false, error: "imageUploadBusy" });
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
        await expect(uploadImageAction(imageForm(png()))).resolves.toEqual({ ok: false, error: "imageUploadFailed" });
        fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 200 }));
        await expect(uploadImageAction(imageForm(png()))).resolves.toEqual({ ok: false, error: "imageUploadFailed" });
        fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
        await expect(uploadImageAction(imageForm(png()))).resolves.toEqual({ ok: false, error: "imageUploadFailed" });
    });

    it("needs a session and sends a rejected one to /session-expired", async () => {
        getAccessToken.mockResolvedValueOnce(null);
        await expect(uploadImageAction(imageForm(png()))).resolves.toEqual({ ok: false, error: "notSignedIn" });

        fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
        await expect(uploadImageAction(imageForm(png()))).rejects.toThrow("REDIRECT:/session-expired");
    });
});
