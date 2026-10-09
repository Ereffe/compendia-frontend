import { z } from "zod";

import { validateImageFile } from "./imageFile";
import { validatePdfFile } from "./pdfFile";
import { err } from "./validation";

import type { ErrorKey } from "@/types/errors";

export const COMPLEXITIES = ["SIMPLE", "INTERMEDIATE", "COMPLEX"] as const;

/** Matches the backend column (articles.title VARCHAR(200)). */
export const TITLE_MAX_LENGTH = 200;
export const MAX_NAME_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 200;
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requiredString = (key: ErrorKey) => z.string(err(key)).trim().min(1, err(key));

export const articleIdSchema = z.string(err("notFound")).regex(/^[A-Za-z0-9]{6}$/, err("notFound"));

export const complexitySchema = z.enum(COMPLEXITIES, err("invalidComplexity"));

const doiListSchema = z
    .array(z.string(err("invalidDoi")), err("invalidDoi"))
    .transform((dois) => dois.map((doi) => doi.trim()).filter(Boolean));

export const createArticleSchema = z.object({
    title: requiredString("missingTitleOrContent").max(TITLE_MAX_LENGTH, err("titleTooLong")),
    content: requiredString("missingTitleOrContent"),
    complexity: complexitySchema,
    references: doiListSchema,
});

export const editArticleSchema = createArticleSchema.extend({ references: doiListSchema.nullable() });

export const commentIdSchema = z.coerce.number(err("notFound")).int(err("notFound")).positive(err("notFound"));

export const commentContentSchema = requiredString("emptyComment");

export const addCommentSchema = z.object({
    articleId: articleIdSchema,
    content: commentContentSchema,
    parentCommentId: commentIdSchema.nullable(),
});

export const editCommentSchema = z.object({ commentId: commentIdSchema, content: commentContentSchema });

export const nameSchema = requiredString("emptyName").max(MAX_NAME_LENGTH, err("nameTooLong"));

export const emailSchema = z
    .string(err("invalidEmail"))
    .trim()
    .max(MAX_EMAIL_LENGTH, { ...err("invalidEmail"), abort: true })
    .regex(EMAIL_PATTERN, err("invalidEmail"));

export const actionIdSchema = z.string(err("invalidActionLink")).regex(/^[A-Za-z]{25}$/, err("invalidActionLink"));

export const newPasswordSchema = z
    .object({
        password: z.string(err("passwordTooShort")).min(MIN_PASSWORD_LENGTH, err("passwordTooShort")),
        confirmation: z.string(err("passwordsDoNotMatch")),
    })
    .refine(({ password, confirmation }) => password === confirmation, err("passwordsDoNotMatch"));

const fileSchema = (invalidType: ErrorKey, validate: (file: File) => ErrorKey | null) =>
    z.instanceof(File, err(invalidType)).superRefine((file, ctx) => {
        const error = validate(file);
        if (error) ctx.addIssue({ code: "custom", message: err(error).error });
    });

export const pdfImportSchema = z.object({
    pdf: fileSchema("pdfInvalidType", validatePdfFile),
    title: requiredString("missingTitle").max(TITLE_MAX_LENGTH, err("titleTooLong")),
    complexity: complexitySchema,
});

export const imageUploadSchema = z.object({ image: fileSchema("imageInvalidType", validateImageFile) });

export const jobIdSchema = z.uuid(err("pdfImportLost"));

export const assetIdSchema = z.uuid(err("imageUploadFailed"));

export const pdfImportAcceptedSchema = z.object({ jobId: jobIdSchema });

export const pdfImportStatusSchema = z.discriminatedUnion(
    "status",
    [
        z.object({ status: z.enum(["PENDING", "PROCESSING"]) }),
        z.object({ status: z.literal("DONE"), articleId: articleIdSchema }),
        z.object({ status: z.literal("FAILED") }),
    ],
    err("pdfImportStatusFailed"),
);
