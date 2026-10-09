"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";

import { serverBackendUrl } from "@/lib/config";
import { SESSION_EXPIRED_PATH } from "@/lib/graphqlErrors";
import { withNotice } from "@/lib/notices";
import { jobIdSchema, pdfImportAcceptedSchema, pdfImportSchema, pdfImportStatusSchema } from "@/lib/schemas";
import { authedMutate, getAccessToken } from "@/lib/server/session";
import { parseInput } from "@/lib/validation";
import { EDIT_ARTICLE_MUTATION } from "@/services/graphql/articles";
import type { ActionResult } from "@/types/articles";

export type PdfImportProgress = "PENDING" | "PROCESSING";

const pdfImportUrl = (jobId?: string) =>
    `${serverBackendUrl}/api/v1/articles/pdf-import${jobId ? `/${encodeURIComponent(jobId)}` : ""}`;

const isAuthRejectedStatus = (status: number) => status === 401 || status === 403;

// The import thread caches the article with an unloaded author proxy (backend issue 6c); a no-op edit evicts it.
async function evictImportedArticle(accessToken: string, articleId: string) {
    try {
        await authedMutate(accessToken, EDIT_ARTICLE_MUTATION, { articleId });
    } catch (error) {
        unstable_rethrow(error);
        console.error("evictImportedArticle failed:", error);
    }
}

export async function startPdfImportAction(formData: FormData): Promise<ActionResult<{ jobId: string }>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const parsed = parseInput(pdfImportSchema, Object.fromEntries(formData), "pdfImportFailed");
    if (!parsed.ok) return parsed;
    const { pdf, title, complexity } = parsed.data;

    const body = new FormData();
    body.append("pdf", pdf, pdf.name);
    body.append("title", title);
    body.append("complexity", complexity);

    let response: Response;
    try {
        response = await fetch(pdfImportUrl(), {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body,
            cache: "no-store",
        });
    } catch (error) {
        console.error("startPdfImportAction failed:", error);
        return { ok: false, error: "pdfImportFailed" };
    }

    // redirect() throws, so it must stay outside the try/catch above.
    if (isAuthRejectedStatus(response.status)) redirect(SESSION_EXPIRED_PATH);
    if (response.status === 400) return { ok: false, error: "pdfInvalidType" };
    if (response.status === 429) return { ok: false, error: "pdfImportBusy" };
    if (!response.ok) {
        console.error("startPdfImportAction failed: HTTP", response.status);
        return { ok: false, error: "pdfImportFailed" };
    }

    const accepted = parseInput(pdfImportAcceptedSchema, await response.json().catch(() => null), "pdfImportFailed");
    return accepted.ok ? { ok: true, data: { jobId: accepted.data.jobId } } : { ok: false, error: "pdfImportFailed" };
}

export async function getPdfImportStatusAction(jobId: string): Promise<ActionResult<{ status: PdfImportProgress }>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };
    if (!jobIdSchema.safeParse(jobId).success) return { ok: false, error: "pdfImportLost" };

    let response: Response;
    try {
        response = await fetch(pdfImportUrl(jobId), {
            headers: { Authorization: `Bearer ${accessToken}` },
            cache: "no-store",
        });
    } catch (error) {
        console.error("getPdfImportStatusAction failed:", error);
        return { ok: false, error: "pdfImportStatusFailed" };
    }

    // The backend also answers 403 for someone else's job, but jobs are only polled by the user who started them.
    if (isAuthRejectedStatus(response.status)) redirect(SESSION_EXPIRED_PATH);
    if (response.status === 404) return { ok: false, error: "pdfImportLost" };
    if (!response.ok) return { ok: false, error: "pdfImportStatusFailed" };

    const job = parseInput(pdfImportStatusSchema, await response.json().catch(() => null), "pdfImportStatusFailed");
    if (!job.ok) return job;
    if (job.data.status === "FAILED") return { ok: false, error: "pdfImportFailed" };
    if (job.data.status === "DONE") {
        await evictImportedArticle(accessToken, job.data.articleId);
        revalidatePath("/articles");
        revalidatePath("/all-articles/[page]", "page");
        redirect(withNotice(`/articles/${job.data.articleId}`, "articleImported"));
    }
    return { ok: true, data: { status: job.data.status } };
}
