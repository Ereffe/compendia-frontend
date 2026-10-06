import type { Dispatch, SetStateAction } from "react";

import {
    changeNameAction,
    confirmEmailChangeAction,
    confirmPasswordChangeAction,
    requestEmailChangeAction,
    requestPasswordChangeAction,
} from "@/app/actions/account";
import { validateEmail, validateName, validateNewPassword } from "@/lib/account";
import type { ErrorKey } from "@/types/errors";

export type FormStatus = "idle" | "pending" | "done";

type FormState = {
    status: FormStatus;
    setStatus: Dispatch<SetStateAction<FormStatus>>;
    setError: Dispatch<SetStateAction<ErrorKey | null>>;
};

type SubmitEvent = { preventDefault: () => void };

const runSubmit = async (
    { status, setStatus, setError }: FormState,
    validationError: ErrorKey | null,
    submit: () => Promise<{ ok: true } | { ok: false; error: ErrorKey }>,
    onSuccess?: () => void,
) => {
    if (status === "pending") return;

    if (validationError) {
        setError(validationError);
        return;
    }

    setError(null);
    setStatus("pending");

    const result = await submit();
    if (!result.ok) {
        setError(result.error);
        setStatus("idle");
        return;
    }

    setStatus("done");
    onSuccess?.();
};

export const createHandleNameSubmit =
    ({ name, currentName, onSaved, ...form }: FormState & { name: string; currentName: string; onSaved: (name: string) => void }) =>
    async (event: SubmitEvent) => {
        event.preventDefault();
        let savedName = name.trim();
        await runSubmit(
            form,
            validateName(name, currentName),
            async () => {
                const result = await changeNameAction(name);
                if (result.ok) savedName = result.data.name;
                return result;
            },
            () => onSaved(savedName),
        );
    };

export const createHandleEmailRequest =
    ({ email, currentEmail, setSentTo, ...form }: FormState & { email: string; currentEmail: string; setSentTo: (email: string) => void }) =>
    async (event: SubmitEvent) => {
        event.preventDefault();
        await runSubmit(form, validateEmail(email, currentEmail), () => requestEmailChangeAction(email), () => setSentTo(email.trim()));
    };

export const createHandlePasswordRequest = (form: FormState) => async () => {
    await runSubmit(form, null, () => requestPasswordChangeAction());
};

export const createHandleEmailConfirm =
    ({ actionId, email, onConfirmed, ...form }: FormState & { actionId: string; email: string; onConfirmed: () => void }) =>
    async (event: SubmitEvent) => {
        event.preventDefault();
        await runSubmit(form, validateEmail(email), () => confirmEmailChangeAction(actionId, email), onConfirmed);
    };

export const createHandlePasswordConfirm =
    ({ actionId, password, confirmation, ...form }: FormState & { actionId: string; password: string; confirmation: string }) =>
    async (event: SubmitEvent) => {
        event.preventDefault();
        await runSubmit(form, validateNewPassword(password, confirmation), () =>
            confirmPasswordChangeAction(actionId, password, confirmation),
        );
    };
