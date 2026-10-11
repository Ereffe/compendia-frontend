"use server";

import { redirect } from "next/navigation";

import { serverBackendUrl } from "@/lib/config";
import { SESSION_EXPIRED_PATH } from "@/lib/graphqlErrors";
import { hasImageSignature, IMAGE_EXTENSIONS } from "@/lib/imageFile";
import { assetIdSchema, imageUploadSchema } from "@/lib/schemas";
import { getAccessToken } from "@/lib/server/session";
import { parseInput } from "@/lib/validation";
import type { ActionResult } from "@/types/articles";

export async function uploadImageAction(formData: FormData): Promise<ActionResult<{ assetId: string }>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const parsed = parseInput(imageUploadSchema, Object.fromEntries(formData), "imageInvalidType");
    if (!parsed.ok) return parsed;
    const { image } = parsed.data;

    // The backend trusts the file extension, so check the bytes really are the declared image type.
    const bytes = new Uint8Array(await image.arrayBuffer());
    if (!hasImageSignature(bytes, image.type)) return { ok: false, error: "imageInvalidType" };

    const body = new FormData();
    body.append("file", new Blob([bytes], { type: image.type }), `image.${IMAGE_EXTENSIONS[image.type]}`);

    let response: Response;
    try {
        response = await fetch(`${serverBackendUrl}/api/v1/articles/assets`, {
            method: "POST",
            headers: { Authorization: `Bearer ${accessToken}` },
            body,
            cache: "no-store",
        });
    } catch (error) {
        console.error("uploadImageAction failed:", error);
        return { ok: false, error: "imageUploadFailed" };
    }

    // redirect() throws, so it must stay outside the try/catch above.
    if (response.status === 401 || response.status === 403) redirect(SESSION_EXPIRED_PATH);
    if (response.status === 429) return { ok: false, error: "imageUploadBusy" };
    if (!response.ok) {
        console.error("uploadImageAction failed: HTTP", response.status);
        return { ok: false, error: "imageUploadFailed" };
    }

    const assetId = parseInput(assetIdSchema, (await response.text().catch(() => "")).trim(), "imageUploadFailed");
    return assetId.ok ? { ok: true, data: { assetId: assetId.data } } : assetId;
}
