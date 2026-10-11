// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPdfImportStatusAction, startPdfImportAction } from "./pdfImport";

const getAccessToken = vi.fn();
const redirect = vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
});
const revalidatePath = vi.fn();

vi.mock("@/lib/server/session", () => ({
    getAccessToken: () => getAccessToken(),
}));
vi.mock("next/navigation", () => ({
    redirect: (path: string) => redirect(path),
}));
vi.mock("next/cache", () => ({ revalidatePath: (...args: unknown[]) => revalidatePath(...args) }));
vi.mock("@/lib/config", () => ({ serverBackendUrl: "https://backend" }));

const JOB_ID = "0b6f3c1e-2f4a-4c8e-9d1a-5e7b8c9d0a1b";

const fetchMock = vi.fn();

const jsonResponse = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), { status });

const importForm = (overrides: Partial<Record<"title" | "complexity", string>> = {}, file?: File) => {
    const formData = new FormData();
    formData.append("pdf", file ?? new File(["%PDF-1.7"], "praca.pdf", { type: "application/pdf" }));
    formData.append("title", overrides.title ?? " Z pliku ");
    formData.append("complexity", overrides.complexity ?? "SIMPLE");
    return formData;
};

beforeEach(() => {
    getAccessToken.mockResolvedValue("token");
    vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe("startPdfImportAction", () => {
    it("uploads the PDF with the title and complexity and returns the job id", async () => {
        fetchMock.mockResolvedValue(jsonResponse(202, { jobId: JOB_ID }));

        await expect(startPdfImportAction(importForm())).resolves.toEqual({ ok: true, data: { jobId: JOB_ID } });

        const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(url).toBe("https://backend/api/v1/articles/pdf-import");
        expect(init.method).toBe("POST");
        expect(init.headers).toEqual({ Authorization: "Bearer token" });
        const body = init.body as FormData;
        expect(body.get("title")).toBe("Z pliku");
        expect(body.get("complexity")).toBe("SIMPLE");
        expect((body.get("pdf") as File).name).toBe("praca.pdf");
    });

    it("validates the input before calling the backend", async () => {
        await expect(startPdfImportAction(importForm({ title: " " }))).resolves.toEqual({ ok: false, error: "missingTitle" });
        await expect(startPdfImportAction(importForm({ complexity: "HARD" }))).resolves.toEqual({
            ok: false,
            error: "invalidComplexity",
        });
        await expect(
            startPdfImportAction(importForm({}, new File(["x"], "a.txt", { type: "text/plain" }))),
        ).resolves.toEqual({ ok: false, error: "pdfInvalidType" });
        getAccessToken.mockResolvedValue(null);
        await expect(startPdfImportAction(importForm())).resolves.toEqual({ ok: false, error: "notSignedIn" });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it("maps backend failures to error keys", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(400));
        await expect(startPdfImportAction(importForm())).resolves.toEqual({ ok: false, error: "pdfInvalidType" });
        fetchMock.mockResolvedValueOnce(jsonResponse(429));
        await expect(startPdfImportAction(importForm())).resolves.toEqual({ ok: false, error: "pdfImportBusy" });
        fetchMock.mockResolvedValueOnce(jsonResponse(500));
        await expect(startPdfImportAction(importForm())).resolves.toEqual({ ok: false, error: "pdfImportFailed" });
        fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
        await expect(startPdfImportAction(importForm())).resolves.toEqual({ ok: false, error: "pdfImportFailed" });
    });

    it("sends a rejected session to /session-expired", async () => {
        fetchMock.mockResolvedValue(jsonResponse(401));

        await expect(startPdfImportAction(importForm())).rejects.toThrow("REDIRECT:/session-expired");
    });
});

describe("getPdfImportStatusAction", () => {
    it("reports progress while the job runs", async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, { jobId: JOB_ID, status: "PROCESSING" }));

        await expect(getPdfImportStatusAction(JOB_ID)).resolves.toEqual({ ok: true, data: { status: "PROCESSING" } });
        expect(fetchMock.mock.calls[0][0]).toBe(`https://backend/api/v1/articles/pdf-import/${JOB_ID}`);
    });

    it("redirects to the new article when the job is done", async () => {
        fetchMock.mockResolvedValue(jsonResponse(200, { jobId: JOB_ID, status: "DONE", articleId: "Abc123" }));

        await expect(getPdfImportStatusAction(JOB_ID)).rejects.toThrow("REDIRECT:/articles/Abc123?notice=articleImported");
        expect(revalidatePath).toHaveBeenCalledWith("/articles");
    });

    it("maps failed, missing and malformed jobs to error keys", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse(200, { jobId: JOB_ID, status: "FAILED", errorMessage: "Ollama down" }));
        await expect(getPdfImportStatusAction(JOB_ID)).resolves.toEqual({ ok: false, error: "pdfImportFailed" });
        fetchMock.mockResolvedValueOnce(jsonResponse(404));
        await expect(getPdfImportStatusAction(JOB_ID)).resolves.toEqual({ ok: false, error: "pdfImportLost" });
        fetchMock.mockResolvedValueOnce(jsonResponse(502));
        await expect(getPdfImportStatusAction(JOB_ID)).resolves.toEqual({ ok: false, error: "pdfImportStatusFailed" });
        await expect(getPdfImportStatusAction("../../admin")).resolves.toEqual({ ok: false, error: "pdfImportLost" });
        expect(fetchMock).toHaveBeenCalledTimes(3);
    });
});
