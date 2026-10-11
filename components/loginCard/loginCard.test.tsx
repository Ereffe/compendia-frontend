import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import LoginCard from "./loginCard";

const replace = vi.fn();
const refresh = vi.fn();
const signIn = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace, refresh }),
}));

vi.mock("next-auth/react", () => ({
    signIn: (...args: unknown[]) => signIn(...args),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("LoginCard", () => {
    it("switches between login and sign-up modes", async () => {
        const user = userEvent.setup();

        renderWithIntl(<LoginCard />);

        expect(screen.queryByLabelText("Imię")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Zarejestruj się" }));

        expect(screen.getByLabelText("Imię")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Zarejestruj się" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Zarejestruj się" })).toHaveAttribute("type", "submit");

        await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

        expect(screen.queryByLabelText("Imię")).not.toBeInTheDocument();
    });

    it("submits credentials and redirects on successful login", async () => {
        const user = userEvent.setup();

        signIn.mockResolvedValue({ ok: true });

        renderWithIntl(<LoginCard />);

        await user.type(screen.getByLabelText("E-mail"), "student@uczelnia.edu");
        await user.type(screen.getByLabelText("Hasło"), "secret123");
        const submitButton = screen.getByRole("button", { name: "Zaloguj się" });

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

        renderWithIntl(<LoginCard />);

        const submitButton = screen.getByRole("button", { name: "Zaloguj się" });

        await user.click(submitButton);

        expect(screen.getByText("Wpisz e-mail i hasło.")).toBeInTheDocument();
        expect(signIn).not.toHaveBeenCalled();
    });

    it("shows a specific message when the e-mail is already registered", async () => {
        const user = userEvent.setup();
        signIn.mockResolvedValue({ ok: false, error: "EmailTaken" });

        renderWithIntl(<LoginCard />);

        await user.click(screen.getByRole("button", { name: "Zarejestruj się" }));
        await user.type(screen.getByLabelText("Imię"), "Ala");
        await user.type(screen.getByLabelText("E-mail"), "ala@uczelnia.edu");
        await user.type(screen.getByLabelText("Hasło"), "secret123");
        await user.click(screen.getByRole("checkbox", { name: "Akceptuję regulamin serwisu" }));
        await user.click(screen.getByRole("button", { name: "Zarejestruj się" }));

        expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ mode: "register", name: "Ala" }));
        expect(await screen.findByRole("alert")).toHaveTextContent("Konto z tym adresem e-mail już istnieje.");
        expect(replace).not.toHaveBeenCalled();
    });

    it("requires accepting the terms to sign up", async () => {
        const user = userEvent.setup();

        renderWithIntl(<LoginCard />);

        await user.click(screen.getByRole("button", { name: "Zarejestruj się" }));
        await user.type(screen.getByLabelText("Imię"), "Ala");
        await user.type(screen.getByLabelText("E-mail"), "ala@uczelnia.edu");
        await user.type(screen.getByLabelText("Hasło"), "secret123");
        await user.click(screen.getByRole("button", { name: "Zarejestruj się" }));

        expect(screen.getByRole("alert")).toHaveTextContent("Zaakceptuj regulamin, aby założyć konto.");
        expect(signIn).not.toHaveBeenCalled();
    });

    it("accepts the terms from the terms dialog", async () => {
        const user = userEvent.setup();

        renderWithIntl(<LoginCard />);

        await user.click(screen.getByRole("button", { name: "Zarejestruj się" }));
        await user.click(screen.getByRole("button", { name: "Przeczytaj regulamin" }));
        expect(screen.getByRole("dialog", { name: "Regulamin serwisu" })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Akceptuję regulamin" }));

        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(screen.getByRole("checkbox", { name: "Akceptuję regulamin serwisu" })).toBeChecked();
    });

    it("does not redirect when login fails", async () => {
        const user = userEvent.setup();
        signIn.mockResolvedValue({ ok: false, error: "CredentialsSignin" });

        renderWithIntl(<LoginCard />);

        await user.type(screen.getByLabelText("E-mail"), "student@uczelnia.edu");
        await user.type(screen.getByLabelText("Hasło"), "wrong");
        await user.click(screen.getByRole("button", { name: "Zaloguj się" }));

        expect(await screen.findByRole("alert")).toHaveTextContent("Nieprawidłowy e-mail lub hasło.");
        expect(replace).not.toHaveBeenCalled();
    });
});