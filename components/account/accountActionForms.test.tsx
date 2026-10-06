import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { confirmEmailChangeAction, confirmPasswordChangeAction } from "@/app/actions/account";
import { renderWithIntl } from "@/test/renderWithIntl";
import { ConfirmEmailChangeForm, ConfirmPasswordChangeForm } from "./accountActionForms";

const update = vi.fn();
let sessionStatus: "authenticated" | "unauthenticated" = "unauthenticated";

vi.mock("@/app/actions/account", () => ({
    confirmEmailChangeAction: vi.fn(),
    confirmPasswordChangeAction: vi.fn(),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("next-auth/react", () => ({
    useSession: () => ({ status: sessionStatus, update }),
}));

const actionId = "aBcDeFgHiJkLmNoPqRsTuVwXy";

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    sessionStatus = "unauthenticated";
});

describe("ConfirmEmailChangeForm", () => {
    it("changes the address and refreshes a signed-in session", async () => {
        sessionStatus = "authenticated";
        vi.mocked(confirmEmailChangeAction).mockResolvedValue({ ok: true, data: null });
        const actor = userEvent.setup();
        renderWithIntl(<ConfirmEmailChangeForm actionId={actionId} />);

        await actor.type(screen.getByLabelText("Nowy adres e-mail"), "ala@new.edu");
        await actor.click(screen.getByRole("button", { name: "Zmień adres e-mail" }));

        expect(confirmEmailChangeAction).toHaveBeenCalledWith(actionId, "ala@new.edu");
        expect(await screen.findByRole("status")).toHaveTextContent("Adres e-mail został zmieniony.");
        expect(screen.getByRole("link", { name: "Przejdź do konta" })).toHaveAttribute("href", "/profile");
        expect(update).toHaveBeenCalledTimes(1);
    });

    it("explains an expired or used link", async () => {
        vi.mocked(confirmEmailChangeAction).mockResolvedValue({ ok: false, error: "changeEmailFailed" });
        const actor = userEvent.setup();
        renderWithIntl(<ConfirmEmailChangeForm actionId={actionId} />, { locale: "en" });

        await actor.type(screen.getByLabelText("New e-mail address"), "ala@new.edu");
        await actor.click(screen.getByRole("button", { name: "Change e-mail address" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("The link may have expired or already been used.");
        expect(update).not.toHaveBeenCalled();
    });
});

describe("ConfirmPasswordChangeForm", () => {
    it("requires matching passwords", async () => {
        const actor = userEvent.setup();
        renderWithIntl(<ConfirmPasswordChangeForm actionId={actionId} />);

        await actor.type(screen.getByLabelText("Nowe hasło"), "long-enough");
        await actor.type(screen.getByLabelText("Powtórz nowe hasło"), "long-enougH");
        await actor.click(screen.getByRole("button", { name: "Zmień hasło" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Hasła się różnią.");
        expect(confirmPasswordChangeAction).not.toHaveBeenCalled();
    });

    it("sends signed-out users to sign in after a change", async () => {
        vi.mocked(confirmPasswordChangeAction).mockResolvedValue({ ok: true, data: null });
        const actor = userEvent.setup();
        renderWithIntl(<ConfirmPasswordChangeForm actionId={actionId} />);

        await actor.type(screen.getByLabelText("Nowe hasło"), "long-enough");
        await actor.type(screen.getByLabelText("Powtórz nowe hasło"), "long-enough");
        await actor.click(screen.getByRole("button", { name: "Zmień hasło" }));

        expect(confirmPasswordChangeAction).toHaveBeenCalledWith(actionId, "long-enough", "long-enough");
        expect(await screen.findByRole("link", { name: "Przejdź do logowania" })).toHaveAttribute("href", "/");
    });
});
