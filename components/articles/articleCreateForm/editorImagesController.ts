import type { Dispatch, SetStateAction } from "react";

import { uploadImageAction } from "@/app/actions/assets";
import { backendAssetPath } from "@/lib/articleContent";
import { imageAltText, validateImageFile } from "@/lib/imageFile";
import type { ErrorKey } from "@/types/errors";

const UPLOAD_SCHEME = "compendia-upload:";

const PLACEHOLDER = /!\[[^\]\n]*\]\(compendia-upload:[a-z0-9]+\)/g;

export const uploadPlaceholder = (alt: string, key: string) => `![${alt}](${UPLOAD_SCHEME}${key})`;

export const insertAtSelection = (content: string, start: number, end: number, snippet: string): string =>
    content.slice(0, start) + snippet + content.slice(end);

export const resolveUploadPlaceholder = (content: string, key: string, url: string | null): string => {
    const target = `](${UPLOAD_SCHEME}${key})`;
    if (url) return content.replace(target, `](${url})`);
    const end = content.indexOf(target);
    if (end === -1) return content;
    const start = content.lastIndexOf("![", end);
    return content.slice(0, start) + content.slice(end + target.length);
};

export const stripUploadPlaceholders = (content: string): string => content.replace(PLACEHOLDER, "");

export const createUploadKey = () => `${Date.now().toString(36)}${crypto.getRandomValues(new Uint32Array(1))[0].toString(36)}`;

export type TextSelection = { start: number; end: number };

type CreateHandleImageFilesParams = {
    defaultAlt: string;
    getSelection: () => TextSelection;
    setContent: Dispatch<SetStateAction<string>>;
    setPendingUploads: Dispatch<SetStateAction<number>>;
    setImageError: Dispatch<SetStateAction<ErrorKey | null>>;
    onUploaded?: (assetId: string) => void;
    createKey?: () => string;
};

export const createHandleImageFiles =
    ({ defaultAlt, getSelection, setContent, setPendingUploads, setImageError, onUploaded, createKey = createUploadKey }: CreateHandleImageFilesParams) =>
        async (files: File[]) => {
            const invalid = files.map(validateImageFile).find(Boolean) ?? null;
            const uploads = files
                .filter((file) => !validateImageFile(file))
                .map((file) => ({ file, key: createKey(), alt: imageAltText(file.name) || defaultAlt }));
            setImageError(invalid);
            if (uploads.length === 0) return;

            const { start, end } = getSelection();
            const snippet = uploads.map(({ alt, key }) => uploadPlaceholder(alt, key)).join("\n\n");
            setContent((current) => insertAtSelection(current, start, end, snippet));
            setPendingUploads((count) => count + uploads.length);

            await Promise.all(
                uploads.map(async ({ file, key }) => {
                    try {
                        const formData = new FormData();
                        formData.append("image", file);
                        const result = await uploadImageAction(formData);
                        if (result?.ok) {
                            setContent((current) => resolveUploadPlaceholder(current, key, backendAssetPath(result.data.assetId)));
                            onUploaded?.(result.data.assetId);
                            return;
                        }
                        setContent((current) => resolveUploadPlaceholder(current, key, null));
                        if (result) setImageError(result.error);
                    } catch {
                        setContent((current) => resolveUploadPlaceholder(current, key, null));
                        setImageError("imageUploadFailed");
                    } finally {
                        setPendingUploads((count) => count - 1);
                    }
                }),
            );
        };
