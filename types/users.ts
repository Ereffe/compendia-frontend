import type { CurrentUserQuery } from "@/services/graphql/generated/graphql";

export type AccountUser = CurrentUserQuery["getCurrentUser"] & { email: string };
