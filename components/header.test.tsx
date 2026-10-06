import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import Header from "./header";

let sessionStatus: "authenticated" | "unauthenticated" = "authenticated";

let pathname = "/articles";

vi.mock("next/link", () => ({
    default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
        <a href={href} {...props}>
            {children}
        </a>
    ),
}));

vi.mock("next/navigation", () => ({
    usePathname: () => pathname,
}));

vi.mock("next-auth/react", () => ({
    useSession: () => ({
        status: sessionStatus,
        data: sessionStatus === "authenticated" ? { user: { id: "user-1", name: "Ala" } } : null,
    }),
}));

vi.mock("./themeToggle", () => ({
    default: () => <div data-testid="theme-toggle" />,
}));

vi.mock("./login-modal", () => ({
    default: () => <div data-testid="login-modal" />,
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    pathname = "/articles";
    sessionStatus = "authenticated";
});

describe("Header", () => {
    it("does not render on the home page", () => {
        pathname = "/";

        const { container } = renderWithIntl(<Header />);

        expect(container.firstChild).toBeNull();
    });

    it("renders navigation links and an account link when the user has access", () => {
        renderWithIntl(<Header />);

        expect(screen.getByRole("link", { name: "COMPENDIA" })).toHaveAttribute("href", "/articles");
        expect(screen.getByRole("link", { name: "Wszystkie artykuły" })).toHaveAttribute("href", "/all-articles/1");
        expect(screen.getByRole("link", { name: "Stwórz artykuł" })).toHaveAttribute("href", "/articles/create");
        expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();

        expect(screen.getByRole("link", { name: "Konto: Ala" })).toHaveAttribute("href", "/profile");
        expect(screen.queryByRole("button", { name: /wyloguj/i })).not.toBeInTheDocument();
    });

    it("shows the login modal when the user does not have access", () => {
        sessionStatus = "unauthenticated";
        renderWithIntl(<Header />);

        expect(screen.getByTestId("login-modal")).toBeInTheDocument();
        expect(screen.queryByRole("link", { name: /konto/i })).not.toBeInTheDocument();
    });
});