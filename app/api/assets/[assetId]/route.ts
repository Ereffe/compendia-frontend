import { serverBackendUrl } from "@/lib/config";
import { ASSET_CONTENT_TYPES } from "@/lib/articleContent";
import { assetIdSchema } from "@/lib/schemas";

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
    const { assetId } = await params;
    if (!assetIdSchema.safeParse(assetId).success) return new Response(null, { status: 404 });

    let response: Response;
    try {
        response = await fetch(`${serverBackendUrl}/api/v1/articles/assets/${assetId}`, {
            headers: { Accept: "image/png,image/jpeg,image/gif" },
            cache: "no-store",
        });
    } catch {
        return new Response(null, { status: 502 });
    }

    const contentType = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
    if (!response.ok) return new Response(null, { status: response.status === 404 ? 404 : 502 });
    // Only pass through image types, so an asset can never be served as HTML or script from this origin.
    if (!ASSET_CONTENT_TYPES.has(contentType)) return new Response(null, { status: 502 });

    return new Response(response.body, {
        headers: {
            "Content-Type": contentType,
            "Cache-Control": "private, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
