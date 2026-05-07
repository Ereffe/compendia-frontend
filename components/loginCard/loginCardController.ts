import type { Dispatch, SetStateAction } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type AuthMode = "login" | "signin";

type CreateHandleCredentialsSignInParams = {
    mode: AuthMode;
    email: string;
    password: string;
    name: string;
    isLoading: boolean;
    setError: Dispatch<SetStateAction<string | null>>;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
    router: ReturnType<typeof useRouter>;
};

export const validateCredentials = (email: string, password: string, name: string, mode: AuthMode): string | null => {
    if (!email || !password || (mode === "signin" && !name.trim())) {
        return mode === "signin" ? "Wpisz imię, e-mail i hasło." : "Wpisz e-mail i hasło.";
    }

    return null;
};

export const getActionLabel = (mode: AuthMode): string => {
    return mode === "login" ? "Zaloguj się" : "Zarejestruj się";
};

export const getDescriptionLabel = (mode: AuthMode): string => {
    return mode === "login"
        ? "Wpisz e-mail i hasło, aby kontynuować."
        : "Utwórz konto, podając imię, e-mail i hasło.";
};

export const getErrorMessage = (mode: AuthMode, error: string | null): string => {
    if (!error) return "";

    if (error === "CredentialsSignin") {
        return mode === "signin"
            ? "Rejestracja nie powiodła się. Spróbuj innego e-maila albo sprawdź logi backendu."
            : "Nieprawidłowy e-mail lub hasło.";
    }

    if (error === "NetworkError" || error.includes("Żądanie")) {
        return "Żądanie nie powiodło się. Sprawdź adres backendu i status serwera.";
    }

    return error;
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
                    email,
                    password,
                    callbackUrl: "/articles",
                    redirect: false,
                });

                if (response?.ok || response?.url) {
                    router.replace("/articles");
                    router.refresh();
                    return;
                }

                const session = await getSession();
                if (session) {
                    router.replace("/articles");
                    router.refresh();
                    return;
                }

                if (response?.error === "CredentialsSignin") {
                    setError(getErrorMessage(mode, response.error));
                } else {
                    setError(response?.error ?? "Nieprawidłowy e-mail lub hasło.");
                }
            } catch (err) {
                const errMsg = err instanceof Error ? err.message : "Żądanie nie powiodło się";
                setError(errMsg + ". Sprawdź adres backendu i status serwera.");
            } finally {
                setIsLoading(false);
            }
        };
