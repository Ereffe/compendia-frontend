import { articleIdSchema } from "./schemas";

export const isValidArticleId = (id: string): boolean => articleIdSchema.safeParse(id).success;
