// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/config", () => ({ serverBackendUrl: "http://backend" }));

const ASSET_ID = "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b";
const fetchMock = vi.fn();

const get = (assetId: string) => GET(new Request("http://app/api/assets/x"), { params: Promise.resolve({ assetId }) });

beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe("GET /api/assets/[assetId]", () => {
    it("proxies an image with a long immutable cache", async () => {
        fetchMock.mockResolvedValue(new Response(new Uint8Array([137, 80]), { headers: { "Content-Type": "image/png" } }));

        const response = await get(ASSET_ID);

        expect(fetchMock.mock.calls[0][0]).toBe(`http://backend/api/v1/articles/assets/${ASSET_ID}`);
        expect(response.status).toBe(200);
        expect(response.headers.get("Content-Type")).toBe("image/png");
        expect(response.headers.get("Cache-Control")).toContain("immutable");
        expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80]));
    });

    it("rejects ids that aren't asset UUIDs without calling the backend", async () => {
        expect((await get("../../graphql")).status).toBe(404);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("never passes through non-image content", async () => {
        fetchMock.mockResolvedValue(new Response("<script>", { headers: { "Content-Type": "text/html" } }));

        expect((await get(ASSET_ID)).status).toBe(502);
    });

    it("maps backend failures", async () => {
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
        expect((await get(ASSET_ID)).status).toBe(404);
        fetchMock.mockResolvedValueOnce(new Response(null, { status: 500 }));
        expect((await get(ASSET_ID)).status).toBe(502);
        fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
        expect((await get(ASSET_ID)).status).toBe(502);
    });
});
