import type { ErrorKey } from "@/types/errors";

import { actionIdSchema, emailSchema, nameSchema, newPasswordSchema } from "./schemas";
import { firstError } from "./validation";

export { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH, MIN_PASSWORD_LENGTH } from "./schemas";

export const isValidActionId = (actionId: string): boolean => actionIdSchema.safeParse(actionId).success;

export const validateName = (name: string, currentName?: string): ErrorKey | null =>
    firstError(nameSchema, name, "emptyName") ??
    (currentName !== undefined && name.trim() === currentName ? "sameName" : null);

export const validateEmail = (email: string, currentEmail?: string): ErrorKey | null =>
    firstError(emailSchema, email, "invalidEmail") ??
    (currentEmail !== undefined && email.trim().toLowerCase() === currentEmail.toLowerCase() ? "sameEmail" : null);

export const validateNewPassword = (password: string, confirmation: string): ErrorKey | null =>
    firstError(newPasswordSchema, { password, confirmation }, "passwordTooShort");
