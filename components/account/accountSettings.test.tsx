import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { changeNameAction, requestEmailChangeAction, requestPasswordChangeAction } from "@/app/actions/account";
import { renderWithIntl } from "@/test/renderWithIntl";
import type { AccountUser } from "@/types/users";
import AccountSettings from "./accountSettings";

const replace = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn();
const update = vi.fn();

vi.mock("@/app/actions/account", () => ({
    changeNameAction: vi.fn(),
    requestEmailChangeAction: vi.fn(),
    requestPasswordChangeAction: vi.fn(),
    confirmEmailChangeAction: vi.fn(),
    confirmPasswordChangeAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace, refresh }),
}));

vi.mock("next-auth/react", () => ({
    signOut: (...args: unknown[]) => signOut(...args),
    useSession: () => ({ status: "authenticated", update }),
}));

const user: AccountUser = { id: "user-1", name: "Ala", email: "ala@uni.edu", role: "USER" };

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("AccountSettings", () => {
    it("shows the account identity with a generated avatar", () => {
        const { container } = renderWithIntl(<AccountSettings user={user} />);

        expect(screen.getAllByText("ala@uni.edu").length).toBeGreaterThan(0);
        expect(screen.getByText("Użytkownik")).toBeInTheDocument();
        expect(container.querySelector("svg[viewBox='0 0 100 100']")).not.toBeNull();
    });

    it("saves a new name and refreshes the session", async () => {
        vi.mocked(changeNameAction).mockResolvedValue({ ok: true, data: { name: "Ala Nowak" } });
        const actor = userEvent.setup();
        renderWithIntl(<AccountSettings user={user} />);

        const input = screen.getByLabelText("Nazwa");
        await actor.clear(input);
        await actor.type(input, "Ala Nowak");
        await actor.click(screen.getByRole("button", { name: "Zapisz nazwę" }));

        expect(changeNameAction).toHaveBeenCalledWith("Ala Nowak");
        expect(await screen.findByText("Zapisano. Nowa nazwa jest już widoczna.")).toBeInTheDocument();
        expect(screen.getAllByText("Ala Nowak").length).toBeGreaterThan(0);
        expect(update).toHaveBeenCalledTimes(1);
    });

    it("validates the name before saving", async () => {
        const actor = userEvent.setup();
        renderWithIntl(<AccountSettings user={user} />);

        await actor.clear(screen.getByLabelText("Nazwa"));
        await actor.click(screen.getByRole("button", { name: "Zapisz nazwę" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Nazwa nie może być pusta.");
        expect(changeNameAction).not.toHaveBeenCalled();
    });

    it("sends an e-mail change link and confirms where it went", async () => {
        vi.mocked(requestEmailChangeAction).mockResolvedValue({ ok: true, data: { email: "ala@new.edu" } });
        const actor = userEvent.setup();
        renderWithIntl(<AccountSettings user={user} />);

        await actor.type(screen.getByLabelText("Nowy adres e-mail"), "ala@new.edu");
        await actor.click(screen.getByRole("button", { name: "Wyślij link" }));

        expect(await screen.findByText(/Wysłaliśmy link na ala@new.edu/)).toBeInTheDocument();
    });

    it("shows a translated error when the password link can't be sent", async () => {
        vi.mocked(requestPasswordChangeAction).mockResolvedValue({ ok: false, error: "passwordRequestFailed" });
        const actor = userEvent.setup();
        renderWithIntl(<AccountSettings user={user} />);

        await actor.click(screen.getByRole("button", { name: "Wyślij link do zmiany hasła" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Nie udało się wysłać linku do zmiany hasła.");
    });

    it("signs out and returns to the landing page", async () => {
        const actor = userEvent.setup();
        renderWithIntl(<AccountSettings user={user} />);

        await actor.click(screen.getByRole("button", { name: "Wyloguj się" }));

        expect(signOut).toHaveBeenCalledWith({ redirect: false });
        expect(replace).toHaveBeenCalledWith("/");
        expect(refresh).toHaveBeenCalledTimes(1);
    });
});
