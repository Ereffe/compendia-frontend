import type { ErrorKey } from "@/types/errors";

// Matches spring.servlet.multipart.max-file-size in the backend.
export const PDF_MAX_BYTES = 50 * 1024 * 1024;

export const PDF_ACCEPT = { "application/pdf": [".pdf"] };

export const validatePdfFile = (file: Pick<File, "name" | "type" | "size">): ErrorKey | null => {
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) return "pdfInvalidType";
    if (file.size === 0) return "pdfEmpty";
    return file.size > PDF_MAX_BYTES ? "pdfTooLarge" : null;
};
