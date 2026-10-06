import type { ErrorKey } from "@/types/errors";

export const MAX_NAME_LENGTH = 200;
export const MAX_EMAIL_LENGTH = 200;
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACTION_ID_PATTERN = /^[A-Za-z]{25}$/;

export const isValidActionId = (actionId: string): boolean => ACTION_ID_PATTERN.test(actionId);

export const validateName = (name: string, currentName?: string): ErrorKey | null => {
    const trimmed = name.trim();
    if (!trimmed) return "emptyName";
    if (trimmed.length > MAX_NAME_LENGTH) return "nameTooLong";
    if (currentName !== undefined && trimmed === currentName) return "sameName";
    return null;
};

export const validateEmail = (email: string, currentEmail?: string): ErrorKey | null => {
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed) || trimmed.length > MAX_EMAIL_LENGTH) return "invalidEmail";
    if (currentEmail !== undefined && trimmed.toLowerCase() === currentEmail.toLowerCase()) return "sameEmail";
    return null;
};

export const validateNewPassword = (password: string, confirmation: string): ErrorKey | null => {
    if (password.length < MIN_PASSWORD_LENGTH) return "passwordTooShort";
    if (password !== confirmation) return "passwordsDoNotMatch";
    return null;
};
