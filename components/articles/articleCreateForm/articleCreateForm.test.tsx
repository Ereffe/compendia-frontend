import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import ArticleCreateForm from "./articleCreateForm";

const push = vi.fn();
const refresh = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push, refresh }),
}));

vi.mock("next-themes", () => ({
    useTheme: () => ({ theme: "dark" }),
}));

vi.mock("@uiw/react-md-editor", () => ({
    default: ({ value, onChange, textareaProps }: { value?: string; onChange?: (value?: string) => void; textareaProps?: { placeholder?: string } }) => (
        <textarea
            aria-label="markdown-editor"
            placeholder={textareaProps?.placeholder}
            value={value ?? ""}
            onChange={(event) => onChange?.(event.target.value)}
        />
    ),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
});

describe("ArticleCreateForm", () => {
    it("renders the form and submits a new article successfully", async () => {
        const user = userEvent.setup();

        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => ({ article: { id: "42", title: "Nowy artykuł" } }),
        });
        vi.stubGlobal("fetch", fetchMock);

        render(<ArticleCreateForm />);

        expect(screen.getByLabelText("Tytuł")).toBeInTheDocument();
        expect(screen.getByLabelText("markdown-editor")).toBeInTheDocument();
        expect(screen.getByLabelText("Id przemiotu (Subject ID)")).toHaveValue(1);
        expect(screen.getByRole("option", { name: "Proste" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Średnie" })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: "Zaawansowane" })).toBeInTheDocument();

        await user.type(screen.getByLabelText("Tytuł"), "Wprowadzenie do grafów");
        await user.type(screen.getByLabelText("markdown-editor"), "Treść artykułu");
        await user.clear(screen.getByLabelText("Id przemiotu (Subject ID)"));
        await user.type(screen.getByLabelText("Id przemiotu (Subject ID)"), "7");
        await user.selectOptions(screen.getByLabelText("Poziom trudności"), "INTERMEDIATE");
        await user.click(screen.getByRole("button", { name: "Utwórz artykuł" }));

        expect(fetchMock).toHaveBeenCalledWith(
            "/api/articles",
            expect.objectContaining({
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Wprowadzenie do grafów",
                    content: "Treść artykułu",
                    subjectId: 7,
                    complexity: "INTERMEDIATE",
                }),
            })
        );
        expect(push).toHaveBeenCalledWith("/articles/42");
        expect(refresh).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Artykuł został utworzony.")).toBeInTheDocument();
    });
});