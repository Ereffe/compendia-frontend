import { describe, expect, it } from "vitest";

import { PDF_MAX_BYTES, validatePdfFile } from "./pdfFile";

describe("validatePdfFile", () => {
    it("validates PDF files against the backend limits", () => {
        expect(validatePdfFile({ name: "a.pdf", type: "application/pdf", size: 10 })).toBeNull();
        expect(validatePdfFile({ name: "A.PDF", type: "", size: 10 })).toBeNull();
        expect(validatePdfFile({ name: "a.docx", type: "application/msword", size: 10 })).toBe("pdfInvalidType");
        expect(validatePdfFile({ name: "a.pdf", type: "application/pdf", size: 0 })).toBe("pdfEmpty");
        expect(validatePdfFile({ name: "a.pdf", type: "application/pdf", size: PDF_MAX_BYTES + 1 })).toBe("pdfTooLarge");
    });
});
