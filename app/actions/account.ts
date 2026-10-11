"use server";

import { unstable_rethrow } from "next/navigation";

import { isAuthRejected, isEmailTakenError } from "@/lib/graphqlErrors";
import { actionIdSchema, emailSchema, nameSchema, newPasswordSchema } from "@/lib/schemas";
import { parseInput } from "@/lib/validation";
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

    const parsed = parseInput(nameSchema, name, "emptyName");
    if (!parsed.ok) return parsed;

    try {
        const data = await authedMutate(accessToken, CHANGE_NAME_MUTATION, { name: parsed.data });
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

    const parsed = parseInput(emailSchema, email, "invalidEmail");
    if (!parsed.ok) return parsed;

    try {
        await authedQuery(accessToken, REQUEST_EMAIL_CHANGE_QUERY, { email: parsed.data });
        return { ok: true, data: { email: parsed.data } };
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

export async function confirmEmailChangeAction(actionId: string): Promise<ActionResult<null>> {
    const parsedId = parseInput(actionIdSchema, actionId, "invalidActionLink");
    if (!parsedId.ok) return parsedId;

    try {
        const result = await getServerClient().mutate({
            mutation: CHANGE_EMAIL_MUTATION,
            variables: { actionId: parsedId.data },
            fetchPolicy: "no-cache",
        });
        if (!result.data?.changeUsersEmail) return { ok: false, error: "changeEmailFailed" };
        return { ok: true, data: null };
    } catch (error) {
        console.error("confirmEmailChangeAction failed:", error);
        return { ok: false, error: isEmailTakenError(error) ? "emailAlreadyTaken" : "changeEmailFailed" };
    }
}

export async function confirmPasswordChangeAction(
    actionId: string,
    password: string,
    confirmation: string,
): Promise<ActionResult<null>> {
    const parsedId = parseInput(actionIdSchema, actionId, "invalidActionLink");
    if (!parsedId.ok) return parsedId;
    const parsedPassword = parseInput(newPasswordSchema, { password, confirmation }, "passwordTooShort");
    if (!parsedPassword.ok) return parsedPassword;

    try {
        const result = await getServerClient().mutate({
            mutation: CHANGE_PASSWORD_MUTATION,
            variables: { actionId: parsedId.data, password: parsedPassword.data.password },
            fetchPolicy: "no-cache",
        });
        if (!result.data?.changeUsersPassword) return { ok: false, error: "changePasswordFailed" };
        return { ok: true, data: null };
    } catch (error) {
        console.error("confirmPasswordChangeAction failed:", error);
        return { ok: false, error: "changePasswordFailed" };
    }
}
