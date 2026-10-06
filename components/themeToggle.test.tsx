import { cleanup, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/renderWithIntl";

import ThemeToggle from "./themeToggle";

const setTheme = vi.fn();
const useThemeMock = vi.fn();

vi.mock("next-themes", () => ({
    useTheme: () => useThemeMock(),
}));

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    setTheme.mockReset();
    useThemeMock.mockReset();
});

describe("ThemeToggle", () => {
    it.each([
        {
            resolvedTheme: "dark",
            expectedLabel: "Przełącz na jasny motyw",
            nextTheme: "light",
        },
        {
            resolvedTheme: "light",
            expectedLabel: "Przełącz na ciemny motyw",
            nextTheme: "dark",
        },
    ])("switches theme from $resolvedTheme mode", async ({ resolvedTheme, expectedLabel, nextTheme }) => {
        useThemeMock.mockReturnValue({ resolvedTheme, setTheme });
        vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((callback) => {
            callback(0);
            return 1;
        });
        vi.spyOn(globalThis, "cancelAnimationFrame").mockImplementation(() => undefined);

        renderWithIntl(<ThemeToggle />);

        const button = await screen.findByRole("button", { name: expectedLabel });
        button.click();

        expect(setTheme).toHaveBeenCalledWith(nextTheme);
    });
});