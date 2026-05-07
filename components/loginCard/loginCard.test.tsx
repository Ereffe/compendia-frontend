import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import LoginCard from "./loginCard";

const replace = vi.fn();
const refresh = vi.fn();
const signIn = vi.fn();
const getSession = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace, refresh }),
}));

vi.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => signIn(...args),
    getSession: (...args: unknown[]) => getSession(...args),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("LoginCard", () => {
    it("switches between login and sign-up modes", async () => {
        const user = userEvent.setup();

        render(<LoginCard />);

        expect(screen.queryByLabelText("Imię")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Zarejestruj się" }));

        expect(screen.getByLabelText("Imię")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Zarejestruj się" })).toBeInTheDocument();
        expect(screen.getByText("Utwórz konto, podając imię, e-mail i hasło.")).toBeInTheDocument();
    });

    it("submits credentials and redirects on successful login", async () => {
        const user = userEvent.setup();

        signIn.mockResolvedValue({ ok: true });

        render(<LoginCard />);

        await user.type(screen.getByLabelText("E-mail"), "student@uczelnia.edu");
        await user.type(screen.getByLabelText("Hasło"), "secret123");
        const submitButton = screen.getAllByRole("button", { name: "Zaloguj się" })[1];

        await user.click(submitButton);

        expect(signIn).toHaveBeenCalledWith(
            "credentials",
            expect.objectContaining({
                mode: "login",
                email: "student@uczelnia.edu",
                password: "secret123",
                callbackUrl: "/articles",
                redirect: false,
            })
        );
        expect(replace).toHaveBeenCalledWith("/articles");
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("shows validation errors when required fields are missing", async () => {
        const user = userEvent.setup();

        render(<LoginCard />);

        const submitButton = screen.getAllByRole("button", { name: "Zaloguj się" })[1];

        await user.click(submitButton);

        expect(screen.getByText("Wpisz e-mail i hasło.")).toBeInTheDocument();
        expect(signIn).not.toHaveBeenCalled();
    });
});