import type { ErrorKey } from "@/types/errors";

// Matches AssetsController.uploadAsset (10 MB) and AssetsService.EXTENSIONS.
export const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export const IMAGE_EXTENSIONS: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
};

export const IMAGE_ACCEPT = Object.keys(IMAGE_EXTENSIONS).join(",");

export const isImageFile = (file: Pick<File, "type">) => file.type in IMAGE_EXTENSIONS;

export const validateImageFile = (file: Pick<File, "type" | "size">): ErrorKey | null => {
    if (!isImageFile(file)) return "imageInvalidType";
    if (file.size === 0) return "imageEmpty";
    return file.size > IMAGE_MAX_BYTES ? "imageTooLarge" : null;
};

const SIGNATURES: Record<string, number[]> = {
    "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    "image/jpeg": [0xff, 0xd8, 0xff],
    "image/gif": [0x47, 0x49, 0x46, 0x38],
};

export const hasImageSignature = (bytes: Uint8Array, type: string): boolean => {
    const signature = SIGNATURES[type];
    return Boolean(signature) && signature.every((byte, index) => bytes[index] === byte);
};

export const imageAltText = (fileName: string): string =>
    fileName
        .replace(/\.[^.]+$/, "")
        .replace(/[[\]()\\]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
