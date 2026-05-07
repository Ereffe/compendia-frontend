import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginModal from "./login-modal";

vi.mock("./loginCard/loginCard", () => ({
    default: () => <div data-testid="login-card" />,
}));

afterEach(() => {
    cleanup();
});

describe("LoginModal", () => {
    it("opens the login card when the trigger is clicked", async () => {
        const user = userEvent.setup();

        render(<LoginModal />);

        expect(screen.getByRole("button", { name: "Zaloguj się" })).toBeInTheDocument();
        expect(screen.queryByTestId("login-card")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

        expect(screen.getByTestId("login-card")).toBeInTheDocument();
    });
});