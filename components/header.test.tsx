import { cleanup, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import Header from "./header";

const replace = vi.fn();
const refresh = vi.fn();
const signOut = vi.fn();
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
    useRouter: () => ({ replace, refresh }),
    usePathname: () => pathname,
}));

vi.mock("next-auth/react", () => ({
    signOut: (...args: unknown[]) => signOut(...args),
    useSession: () => ({
        status: sessionStatus,
        data: sessionStatus === "authenticated" ? { user: { name: "Ala" } } : null,
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

    it("renders navigation links and logout flow when the user has access", async () => {
        const user = userEvent.setup();

        renderWithIntl(<Header />);

        expect(screen.getByRole("link", { name: "COMPENDIA" })).toHaveAttribute("href", "/articles");
        expect(screen.getByRole("link", { name: "Wszystkie artykuły" })).toHaveAttribute("href", "/all-articles/1");
        expect(screen.getByRole("link", { name: "Stwórz artykuł" })).toHaveAttribute("href", "/articles/create");
        expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Wyloguj" }));

        expect(signOut).toHaveBeenCalledWith({ redirect: false });
        expect(replace).toHaveBeenCalledWith("/");
        expect(refresh).toHaveBeenCalledTimes(1);
    });

    it("shows the login modal when the user does not have access", () => {
        sessionStatus = "unauthenticated";
        renderWithIntl(<Header />);

        expect(screen.getByTestId("login-modal")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Wyloguj" })).not.toBeInTheDocument();
    });
});