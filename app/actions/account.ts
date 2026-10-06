"use server";

import { unstable_rethrow } from "next/navigation";

import { isValidActionId, validateEmail, validateName, validateNewPassword } from "@/lib/account";
import { isAuthRejected } from "@/lib/graphqlErrors";
import { getServerClient } from "@/lib/server/apollo";
import { authedMutate, authedQuery, getAccessToken } from "@/lib/server/session";
import {
    CHANGE_EMAIL_MUTATION,
    CHANGE_NAME_MUTATION,
    CHANGE_PASSWORD_MUTATION,
    REQUEST_EMAIL_CHANGE_QUERY,
    REQUEST_PASSWORD_CHANGE_QUERY,
} from "@/services/graphql/users";
import type { ActionResult } from "@/types/articles";
import type { ErrorKey } from "@/types/errors";

const failureKey = (error: unknown, fallback: ErrorKey): ErrorKey => (isAuthRejected(error) ? "sessionExpired" : fallback);

export async function changeNameAction(name: string): Promise<ActionResult<{ name: string }>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const validationError = validateName(name);
    if (validationError) return { ok: false, error: validationError };

    try {
        const data = await authedMutate<{ changeUsersName: { name: string } | null }>(accessToken, CHANGE_NAME_MUTATION, {
            name: name.trim(),
        });
        if (!data.changeUsersName) return { ok: false, error: "changeNameFailed" };
        return { ok: true, data: { name: data.changeUsersName.name } };
    } catch (error) {
        unstable_rethrow(error);
        console.error("changeNameAction failed:", error);
        return { ok: false, error: failureKey(error, "changeNameFailed") };
    }
}

export async function requestEmailChangeAction(email: string): Promise<ActionResult<{ email: string }>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    const validationError = validateEmail(email);
    if (validationError) return { ok: false, error: validationError };

    const trimmedEmail = email.trim();
    try {
        await authedQuery(accessToken, REQUEST_EMAIL_CHANGE_QUERY, { email: trimmedEmail });
        return { ok: true, data: { email: trimmedEmail } };
    } catch (error) {
        unstable_rethrow(error);
        console.error("requestEmailChangeAction failed:", error);
        return { ok: false, error: failureKey(error, "emailRequestFailed") };
    }
}

export async function requestPasswordChangeAction(): Promise<ActionResult<null>> {
    const accessToken = await getAccessToken();
    if (!accessToken) return { ok: false, error: "notSignedIn" };

    try {
        await authedQuery(accessToken, REQUEST_PASSWORD_CHANGE_QUERY);
        return { ok: true, data: null };
    } catch (error) {
        unstable_rethrow(error);
        console.error("requestPasswordChangeAction failed:", error);
        return { ok: false, error: failureKey(error, "passwordRequestFailed") };
    }
}

export async function confirmEmailChangeAction(actionId: string, email: string): Promise<ActionResult<null>> {
    if (!isValidActionId(actionId)) return { ok: false, error: "invalidActionLink" };

    const validationError = validateEmail(email);
    if (validationError) return { ok: false, error: validationError };

    try {
        const result = await getServerClient().mutate<{ changeUsersEmail: { id: string } | null }>({
            mutation: CHANGE_EMAIL_MUTATION,
            variables: { actionId, email: email.trim() },
            fetchPolicy: "no-cache",
        });
        if (!result.data?.changeUsersEmail) return { ok: false, error: "changeEmailFailed" };
        return { ok: true, data: null };
    } catch (error) {
        console.error("confirmEmailChangeAction failed:", error);
        return { ok: false, error: "changeEmailFailed" };
    }
}

export async function confirmPasswordChangeAction(
    actionId: string,
    password: string,
    confirmation: string,
): Promise<ActionResult<null>> {
    if (!isValidActionId(actionId)) return { ok: false, error: "invalidActionLink" };

    const validationError = validateNewPassword(password, confirmation);
    if (validationError) return { ok: false, error: validationError };

    try {
        const result = await getServerClient().mutate<{ changeUsersPassword: { id: string } | null }>({
            mutation: CHANGE_PASSWORD_MUTATION,
            variables: { actionId, password },
            fetchPolicy: "no-cache",
        });
        if (!result.data?.changeUsersPassword) return { ok: false, error: "changePasswordFailed" };
        return { ok: true, data: null };
    } catch (error) {
        console.error("confirmPasswordChangeAction failed:", error);
        return { ok: false, error: "changePasswordFailed" };
    }
}
