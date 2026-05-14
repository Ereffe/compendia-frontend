import type { Dispatch, SetStateAction } from "react";
import { useRouter } from "next/navigation";

export type CreatedArticle = {
    id: string;
    title: string;
};

type CreateHandleArticleSubmitParams = {
    title: string;
    content: string;
    subjectId: string;
    references?: Array<string>;
    complexity: string;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<string | null>>;
    setSuccess: Dispatch<SetStateAction<string | null>>;
    router: ReturnType<typeof useRouter>;
};

export const validateArticleFormInputs = (
    title: string,
    content: string,
    subjectId: string,
): string | null => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const parsedSubjectId = Number.parseInt(subjectId, 10);

    if (!trimmedTitle || !trimmedContent || Number.isNaN(parsedSubjectId) || parsedSubjectId <= 0) {
        return "Uzupełnij tytuł, treść i poprawny Subject ID.";
    }

    return null;
};

export const getComplexityOptions = (): Array<{ value: string; label: string }> => [
    { value: "SIMPLE", label: "Proste" },
    { value: "INTERMEDIATE", label: "Średnie" },
    { value: "COMPLEX", label: "Zaawansowane" },
];

export const getFormSubmitLabel = (isSubmitting: boolean): string => {
    return isSubmitting ? "Tworzenie..." : "Utwórz artykuł";
};

export const createHandleArticleSubmit =
    ({
        title,
        content,
        subjectId,
        references = [],
        complexity,
        isSubmitting,
        setIsSubmitting,
        setError,
        setSuccess,
        router,
    }: CreateHandleArticleSubmitParams) =>
        async (event: React.SyntheticEvent<HTMLFormElement>) => {
            event.preventDefault();

            const validationError = validateArticleFormInputs(title, content, subjectId);
            if (validationError) {
                setError(validationError);
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
                        title: title.trim(),
                        content: content.trim(),
                        subjectId: Number.parseInt(subjectId, 10),
                        complexity,
                        references,
                    }),
                });

                console.log(JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    subjectId: Number.parseInt(subjectId, 10),
                    complexity,
                    references,
                }),)

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
                setError(
                    submitError instanceof Error
                        ? submitError.message
                        : "Nie udało się utworzyć artykułu.",
                );
            } finally {
                setIsSubmitting(false);
            }
        };
