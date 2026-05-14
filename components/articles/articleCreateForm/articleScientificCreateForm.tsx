"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MDEditor from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import {
    createHandleArticleSubmit,
    getComplexityOptions,
    getFormSubmitLabel,
} from "./articleCreateFormController";

export default function ArticleScientificCreateForm() {
    const router = useRouter();
    const { theme } = useTheme();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [subjectId, setSubjectId] = useState("1");
    const [complexity, setComplexity] = useState("SIMPLE");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);



    const handleSubmit = createHandleArticleSubmit({
        title,
        content,
        subjectId,
        complexity,
        isSubmitting,
        setIsSubmitting,
        setError,
        setSuccess,
        router,
    });

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_24px_90px_-60px_rgba(15,23,42,0.8)] backdrop-blur sm:p-8"
        >
            <div className="grid gap-5">
                <div className="grid gap-2">
                    <label
                        htmlFor="title"
                        className="text-sm font-medium text-foreground/90"
                    >
                        Tytuł
                    </label>
                    <Input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Np. Wprowadzenie do struktur danych"
                        className="h-11 rounded-xl border-border bg-background text-sm"
                    />
                </div>

                <div className="grid gap-2">
                    <label
                        htmlFor="title"
                        className="text-sm font-medium text-foreground/90"
                    >
                        Numer DOI
                    </label>
                    <Input
                        id="doi"

                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Np. 10.1234/56789"
                        className="h-11 rounded-xl border-border bg-background text-sm"
                    />
                </div>

                <div className="grid gap-2">
                    <label
                        htmlFor="content"
                        className="text-sm font-medium text-foreground/90"
                    >
                        Komentarz do artykułu naukowego
                    </label>
                    <div
                        className="rounded-xl border border-border overflow-hidden"
                        data-color-mode={theme || "light"}
                    >
                        <MDEditor
                            value={content}
                            onChange={(value) => setContent(value ?? "")}
                            preview="live"
                            height={288}
                            visibleDragbar={false}
                            hideToolbar={false}
                            textareaProps={{
                                placeholder: "Rozpocznij pisać markdown...",
                            }}
                            className="bg-background text-sm"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <label
                            htmlFor="subjectId"
                            className="text-sm font-medium text-foreground/90"
                        >
                            Id przemiotu (Subject ID)
                        </label>
                        <Input
                            id="subjectId"
                            type="number"
                            min="1"
                            value={subjectId}
                            onChange={(event) => setSubjectId(event.target.value)}
                            className="h-11 rounded-xl border-border bg-background text-sm"
                        />
                    </div>

                    <div className="grid gap-2">
                        <label
                            htmlFor="complexity"
                            className="text-sm font-medium text-foreground/90"
                        >
                            Poziom trudności
                        </label>
                        <select
                            id="complexity"
                            value={complexity}
                            onChange={(event) => setComplexity(event.target.value)}
                            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        >
                            {getComplexityOptions().map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Po wysłaniu formularza zostaniesz przekierowany do nowo utworzonego
                        artykułu.
                    </p>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto"
                    >
                        {getFormSubmitLabel(isSubmitting)}
                    </Button>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {success ? (
                    <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        {success}
                    </p>
                ) : null}
            </div>
        </form>
    );
}
