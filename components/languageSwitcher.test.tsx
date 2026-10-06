import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";
import LanguageSwitcher from "./languageSwitcher";

const setLocaleAction = vi.fn();

vi.mock("@/app/actions/locale", () => ({
    setLocaleAction: (...args: unknown[]) => setLocaleAction(...args),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("LanguageSwitcher", () => {
    it("marks Polish as active by default and switches to English", async () => {
        const user = userEvent.setup();
        setLocaleAction.mockResolvedValue(undefined);

        renderWithIntl(<LanguageSwitcher />);

        expect(screen.getByRole("group", { name: "Język" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Zmień język na: Polski" })).toHaveAttribute("aria-pressed", "true");

        await user.click(screen.getByRole("button", { name: "Zmień język na: English" }));

        expect(setLocaleAction).toHaveBeenCalledWith("en");
    });

    it("does nothing when the active language is clicked", async () => {
        const user = userEvent.setup();

        renderWithIntl(<LanguageSwitcher />, { locale: "en" });

        await user.click(screen.getByRole("button", { name: "Switch language to: English" }));

        expect(setLocaleAction).not.toHaveBeenCalled();
    });
});
