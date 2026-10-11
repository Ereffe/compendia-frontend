import { afterEach, describe, expect, it, vi } from "vitest";

import {
    changeNameAction,
    confirmEmailChangeAction,
    confirmPasswordChangeAction,
    requestEmailChangeAction,
} from "@/app/actions/account";
import {
    createHandleEmailConfirm,
    createHandleEmailRequest,
    createHandleNameSubmit,
    createHandlePasswordConfirm,
} from "./accountController";

vi.mock("@/app/actions/account", () => ({
    changeNameAction: vi.fn(),
    requestEmailChangeAction: vi.fn(),
    requestPasswordChangeAction: vi.fn(),
    confirmEmailChangeAction: vi.fn(),
    confirmPasswordChangeAction: vi.fn(),
}));

const event = { preventDefault: vi.fn() };
const form = () => ({ status: "idle" as const, setStatus: vi.fn(), setError: vi.fn() });

afterEach(() => {
    vi.clearAllMocks();
});

describe("createHandleNameSubmit", () => {
    it("reports validation errors without calling the backend", async () => {
        const state = form();
        await createHandleNameSubmit({ ...state, name: " Ala ", currentName: "Ala", onSaved: vi.fn() })(event);

        expect(state.setError).toHaveBeenCalledWith("sameName");
        expect(changeNameAction).not.toHaveBeenCalled();
    });

    it("saves the name returned by the backend", async () => {
        vi.mocked(changeNameAction).mockResolvedValue({ ok: true, data: { name: "Ala Nowak" } });
        const state = form();
        const onSaved = vi.fn();

        await createHandleNameSubmit({ ...state, name: "Ala Nowak ", currentName: "Ala", onSaved })(event);

        expect(state.setStatus).toHaveBeenNthCalledWith(1, "pending");
        expect(state.setStatus).toHaveBeenLastCalledWith("done");
        expect(onSaved).toHaveBeenCalledWith("Ala Nowak");
    });

    it("shows the action's error and returns to idle", async () => {
        vi.mocked(changeNameAction).mockResolvedValue({ ok: false, error: "changeNameFailed" });
        const state = form();
        const onSaved = vi.fn();

        await createHandleNameSubmit({ ...state, name: "Ola", currentName: "Ala", onSaved })(event);

        expect(state.setError).toHaveBeenLastCalledWith("changeNameFailed");
        expect(state.setStatus).toHaveBeenLastCalledWith("idle");
        expect(onSaved).not.toHaveBeenCalled();
    });

    it("ignores submits while a request is pending", async () => {
        const state = { ...form(), status: "pending" as const };
        await createHandleNameSubmit({ ...state, name: "Ola", currentName: "Ala", onSaved: vi.fn() })(event);

        expect(changeNameAction).not.toHaveBeenCalled();
    });
});

describe("createHandleEmailRequest", () => {
    it("rejects the current address", async () => {
        const state = form();
        await createHandleEmailRequest({ ...state, email: "ALA@uni.edu", currentEmail: "ala@uni.edu", setSentTo: vi.fn() })(event);

        expect(state.setError).toHaveBeenCalledWith("sameEmail");
        expect(requestEmailChangeAction).not.toHaveBeenCalled();
    });

    it("remembers where the link was sent", async () => {
        vi.mocked(requestEmailChangeAction).mockResolvedValue({ ok: true, data: { email: "ala@new.edu" } });
        const setSentTo = vi.fn();

        await createHandleEmailRequest({ ...form(), email: " ala@new.edu ", currentEmail: "ala@uni.edu", setSentTo })(event);

        expect(requestEmailChangeAction).toHaveBeenCalledWith(" ala@new.edu ");
        expect(setSentTo).toHaveBeenCalledWith("ala@new.edu");
    });
});

describe("confirm handlers", () => {
    it("confirms an e-mail change and notifies the caller", async () => {
        vi.mocked(confirmEmailChangeAction).mockResolvedValue({ ok: true, data: null });
        const onConfirmed = vi.fn();

        await createHandleEmailConfirm({ ...form(), actionId: "abc", onConfirmed })(event);

        expect(confirmEmailChangeAction).toHaveBeenCalledWith("abc");
        expect(onConfirmed).toHaveBeenCalledTimes(1);
    });

    it("checks the password confirmation before calling the backend", async () => {
        const state = form();
        await createHandlePasswordConfirm({ ...state, actionId: "abc", password: "long-enough", confirmation: "different" })(event);

        expect(state.setError).toHaveBeenCalledWith("passwordsDoNotMatch");
        expect(confirmPasswordChangeAction).not.toHaveBeenCalled();
    });
});
