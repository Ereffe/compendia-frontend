import { describe, expect, it } from "vitest";

import {
    addCommentSchema,
    commentIdSchema,
    createArticleSchema,
    editArticleSchema,
    emailSchema,
    pdfImportSchema,
    pdfImportStatusSchema,
    TITLE_MAX_LENGTH,
} from "./schemas";
import { parseInput } from "./validation";

const article = { title: " Tytuł ", content: " Treść ", complexity: "SIMPLE", references: [" 10.1000/a ", " "], uploadedImages: [] };

describe("article schemas", () => {
    it("trims text and drops blank references", () => {
        expect(parseInput(createArticleSchema, article, "createArticleFailed")).toEqual({
            ok: true,
            data: { title: "Tytuł", content: "Treść", complexity: "SIMPLE", references: ["10.1000/a"], uploadedImages: [] },
        });
        expect(parseInput(editArticleSchema, { ...article, references: null }, "editArticleFailed")).toMatchObject({
            ok: true,
            data: { references: null },
        });
    });

    it("reports the first problem as a translation key", () => {
        expect(parseInput(createArticleSchema, { ...article, title: "  " }, "createArticleFailed")).toEqual({
            ok: false,
            error: "missingTitleOrContent",
        });
        expect(parseInput(createArticleSchema, { ...article, title: "x".repeat(TITLE_MAX_LENGTH + 1) }, "createArticleFailed")).toEqual({
            ok: false,
            error: "titleTooLong",
        });
        expect(parseInput(createArticleSchema, { ...article, complexity: "HARD" }, "createArticleFailed")).toEqual({
            ok: false,
            error: "invalidComplexity",
        });
    });

    it("falls back to the action's error for malformed input", () => {
        expect(parseInput(createArticleSchema, "not an object", "createArticleFailed")).toEqual({
            ok: false,
            error: "createArticleFailed",
        });
    });
});

describe("comment schemas", () => {
    it("accepts numeric comment ids sent as strings", () => {
        expect(commentIdSchema.parse("42")).toBe(42);
        expect(parseInput(commentIdSchema, "abc", "deleteCommentFailed")).toEqual({ ok: false, error: "notFound" });
        expect(parseInput(commentIdSchema, "-1", "deleteCommentFailed")).toEqual({ ok: false, error: "notFound" });
    });

    it("validates the article id and content of a new comment", () => {
        expect(addCommentSchema.parse({ articleId: "Abc123", content: " Hej ", parentCommentId: "7" })).toEqual({
            articleId: "Abc123",
            content: "Hej",
            parentCommentId: 7,
        });
        expect(parseInput(addCommentSchema, { articleId: "../x", content: "Hej", parentCommentId: null }, "addCommentFailed")).toEqual({
            ok: false,
            error: "notFound",
        });
        expect(parseInput(addCommentSchema, { articleId: "Abc123", content: " ", parentCommentId: null }, "addCommentFailed")).toEqual({
            ok: false,
            error: "emptyComment",
        });
    });
});

describe("emailSchema", () => {
    it("rejects overlong input before running the pattern", () => {
        expect(parseInput(emailSchema, `${"a".repeat(5000)}@`, "invalidEmail")).toEqual({ ok: false, error: "invalidEmail" });
        expect(emailSchema.parse(" ala@uni.edu ")).toBe("ala@uni.edu");
    });
});

describe("PDF import schemas", () => {
    const pdf = new File(["%PDF-1.7"], "praca.pdf", { type: "application/pdf" });

    it("validates the uploaded form", () => {
        expect(parseInput(pdfImportSchema, { pdf, title: " T ", complexity: "COMPLEX" }, "pdfImportFailed")).toEqual({
            ok: true,
            data: { pdf, title: "T", complexity: "COMPLEX" },
        });
        const txt = new File(["x"], "a.txt", { type: "text/plain" });
        expect(parseInput(pdfImportSchema, { pdf: txt, title: "T", complexity: "COMPLEX" }, "pdfImportFailed")).toEqual({
            ok: false,
            error: "pdfInvalidType",
        });
        expect(parseInput(pdfImportSchema, { pdf: "not a file", title: "T", complexity: "COMPLEX" }, "pdfImportFailed")).toEqual({
            ok: false,
            error: "pdfInvalidType",
        });
    });

    it("only accepts a finished job with a well-formed article id, so the redirect can't be steered", () => {
        expect(pdfImportStatusSchema.parse({ status: "DONE", articleId: "Abc123", jobId: "x" })).toEqual({
            status: "DONE",
            articleId: "Abc123",
        });
        expect(parseInput(pdfImportStatusSchema, { status: "DONE", articleId: "//evil.example" }, "pdfImportStatusFailed").ok).toBe(false);
        expect(parseInput(pdfImportStatusSchema, { status: "UNKNOWN" }, "pdfImportStatusFailed")).toEqual({
            ok: false,
            error: "pdfImportStatusFailed",
        });
    });
});
