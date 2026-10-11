import type { Dispatch, SetStateAction } from "react";
import { signIn } from "next-auth/react";

import type { AuthMode } from "@/lib/auth";
import { EMAIL_PATTERN, MIN_PASSWORD_LENGTH } from "@/lib/schemas";
import type { LoginErrorKey } from "@/types/errors";

export type { AuthMode } from "@/lib/auth";

type Router = { replace: (href: string) => void; refresh: () => void };

type CreateHandleCredentialsSignInParams = {
    mode: AuthMode;
    email: string;
    password: string;
    name: string;
    isLoading: boolean;
    setError: Dispatch<SetStateAction<LoginError | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    router: Router;
};

export type LoginError = { key: LoginErrorKey; values?: Record<string, number> };

export const validateCredentials = (email: string, password: string, name: string, mode: AuthMode): LoginError | null => {
    if (!email.trim() || !password || (mode === "register" && !name.trim())) {
        return { key: mode === "register" ? "missingFieldsRegister" : "missingFieldsLogin" };
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
        return { key: "invalidEmail" };
    }

    if (mode === "register" && password.length < MIN_PASSWORD_LENGTH) {
        return { key: "passwordTooShort", values: { min: MIN_PASSWORD_LENGTH } };
    }

    return null;
};

export const getLoginErrorKey = (mode: AuthMode, code: string): LoginErrorKey => {
    switch (code) {
        case "CredentialsSignin":
            return mode === "register" ? "registerFailed" : "invalidCredentials";
        case "EmailTaken":
            return "emailTaken";
        case "BackendUnavailable":
            return "backendUnavailable";
        default:
            return "loginFailed";
    }
};

export const createHandleCredentialsSignIn =
    ({
        mode,
        email,
        password,
        name,
        isLoading,
        setError,
        setIsLoading,
        router,
    }: CreateHandleCredentialsSignInParams) =>
        async (event: React.SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();

            if (isLoading) {
                return;
            }

            const validationError = validateCredentials(email, password, name, mode);
            if (validationError) {
                setError(validationError);
                return;
            }

            setError(null);
            setIsLoading(true);

            try {
                const response = await signIn("credentials", {
                    mode,
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    callbackUrl: "/articles",
                    redirect: false,
                });

                if (response?.ok && !response.error) {
                    router.replace("/articles");
                    router.refresh();
                    return;
                }

                setError({ key: getLoginErrorKey(mode, response?.error ?? "CredentialsSignin") });
            } catch {
                setError({ key: "backendUnavailable" });
            } finally {
                setIsLoading(false);
            }
        };
