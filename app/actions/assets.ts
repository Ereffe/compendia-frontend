"use server";

import { redirect } from "next/navigation";

import { ASSET_ID_PATTERN } from "@/lib/articleContent";
import { serverBackendUrl } from "@/lib/config";
import { SESSION_EXPIRED_PATH } from "@/lib/graphqlErrors";
import { hasImageSignature, IMAGE_EXTENSIONS, validateImageFile } from "@/lib/imageFile";
import { getAccessToken } from "@/lib/server/session";
import type { ActionResult } from "@/types/articles";

export async function uploadImageAction(formData: FormData): Promise<ActionResult<{ assetId: string }>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const image = formData.get("image");
    if (!(image instanceof File)) return { ok: false, error: "imageInvalidType" };
    const imageError = validateImageFile(image);
    if (imageError) return { ok: false, error: imageError };

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

    const assetId = (await response.text().catch(() => "")).trim();
    return ASSET_ID_PATTERN.test(assetId) ? { ok: true, data: { assetId } } : { ok: false, error: "imageUploadFailed" };
}
