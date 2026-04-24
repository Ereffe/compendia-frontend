"use client";

import { useRouter } from "next/navigation";
import { type SyntheticEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type CreatedArticle = {
    id: string;
    title: string;
};

export default function ArticleCreateForm() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [subjectId, setSubjectId] = useState("1");
    const [complexity, setComplexity] = useState("SIMPLE");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedContent = content.trim();
        const parsedSubjectId = Number.parseInt(subjectId, 10);

        if (!trimmedTitle || !trimmedContent || Number.isNaN(parsedSubjectId) || parsedSubjectId <= 0) {
            setError("Uzupełnij tytuł, treść i poprawny Subject ID.");
            return;
        }

        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/articles", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: trimmedTitle,
                    content: trimmedContent,
                    subjectId: parsedSubjectId,
                    complexity,
                }),
            });

            const payload = (await response.json()) as {
                article?: CreatedArticle;
                error?: string;
            };

            if (!response.ok || !payload.article) {
                throw new Error(payload.error ?? "Nie udało się utworzyć artykułu.");
            }

            setSuccess("Artykuł został utworzony.");
            router.push(`/articles/${payload.article.id}`);
            router.refresh();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Nie udało się utworzyć artykułu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-[0_24px_90px_-60px_rgba(15,23,42,0.8)] backdrop-blur sm:p-8">
            <div className="grid gap-5">
                <div className="grid gap-2">
                    <label htmlFor="title" className="text-sm font-medium text-foreground/90">
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
                    <label htmlFor="content" className="text-sm font-medium text-foreground/90">
                        Treść
                    </label>
                    <Textarea
                        id="content"
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                        placeholder="Rozpocznij od krótkiego wstępu, a potem dodaj kolejne sekcje..."
                        className="min-h-72 rounded-xl border-border bg-background text-sm"
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                        <label htmlFor="subjectId" className="text-sm font-medium text-foreground/90">
                            Subject ID
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
                        <label htmlFor="complexity" className="text-sm font-medium text-foreground/90">
                            Complexity
                        </label>
                        <select
                            id="complexity"
                            value={complexity}
                            onChange={(event) => setComplexity(event.target.value)}
                            className="h-11 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                        >
                            <option value="SIMPLE">SIMPLE</option>
                            <option value="INTERMEDIATE">INTERMEDIATE</option>
                            <option value="COMPLEX">COMPLEX</option>
                        </select>
                    </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-muted-foreground">
                        Po wysłaniu formularza zostaniesz przekierowany do nowo utworzonego artykułu.
                    </p>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                        {isSubmitting ? "Tworzenie..." : "Utwórz artykuł"}
                    </Button>
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
                {success ? <p className="text-sm text-emerald-600 dark:text-emerald-400">{success}</p> : null}
            </div>
        </form>
    );
}