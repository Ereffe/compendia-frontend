import { describe, expect, it } from "vitest";

import { hasImageSignature, IMAGE_MAX_BYTES, imageAltText, validateImageFile } from "./imageFile";

describe("validateImageFile", () => {
    it("accepts the backend's image types within the size limit", () => {
        expect(validateImageFile({ type: "image/png", size: 10 })).toBeNull();
        expect(validateImageFile({ type: "image/jpeg", size: 10 })).toBeNull();
        expect(validateImageFile({ type: "image/gif", size: 10 })).toBeNull();
    });

    it("rejects other types, empty and oversized files", () => {
        expect(validateImageFile({ type: "image/svg+xml", size: 10 })).toBe("imageInvalidType");
        expect(validateImageFile({ type: "image/webp", size: 10 })).toBe("imageInvalidType");
        expect(validateImageFile({ type: "image/png", size: 0 })).toBe("imageEmpty");
        expect(validateImageFile({ type: "image/png", size: IMAGE_MAX_BYTES + 1 })).toBe("imageTooLarge");
    });
});

describe("hasImageSignature", () => {
    it("checks the file starts with the declared type's magic bytes", () => {
        expect(hasImageSignature(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]), "image/png")).toBe(true);
        expect(hasImageSignature(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), "image/jpeg")).toBe(true);
        expect(hasImageSignature(new TextEncoder().encode("GIF89a"), "image/gif")).toBe(true);
        expect(hasImageSignature(new TextEncoder().encode("<html>"), "image/png")).toBe(false);
        expect(hasImageSignature(new Uint8Array([0xff, 0xd8, 0xff]), "image/svg+xml")).toBe(false);
    });
});

describe("imageAltText", () => {
    it("turns a file name into markdown-safe alt text", () => {
        expect(imageAltText("Wykres [v2] (final).png")).toBe("Wykres v2 final");
        expect(imageAltText("image.png")).toBe("image");
        expect(imageAltText(".png")).toBe("");
    });
});
