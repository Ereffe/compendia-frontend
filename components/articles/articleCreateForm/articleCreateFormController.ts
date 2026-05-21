import type { Dispatch, SetStateAction } from "react";
import type React from "react";
import type { ApolloClient } from "@apollo/client";
import { gql } from "@apollo/client";
import getBrowserClient from "@/lib/apolloBrowser";

export type CreatedArticle = {
    id: string;
    title: string;
};

type CreateHandleArticleSubmitParams = {
    client?: ApolloClient;
    isScientific?: boolean;
    title: string;
    content: string;
    subjectId?: number;
    tags?: Array<string>;
    references?: Array<string>;
    complexity: string;
    isSubmitting: boolean;
    setIsSubmitting: Dispatch<SetStateAction<boolean>>;
    setError: Dispatch<SetStateAction<string | null>>;
    setSuccess: Dispatch<SetStateAction<string | null>>;
    router: ReturnType<typeof import("next/navigation").useRouter>;
};

export const validateArticleFormInputs = (
    title: string,
    content: string,
): string | null => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
        return "Uzupełnij tytuł i treść.";
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

            const validationError = validateArticleFormInputs(title, content);
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
                const ADD_ARTICLE = gql`
                    mutation AddArticle(
                        $title: String!
                        $content: String!
                        $complexity: String!
                        $references: [String!]
                    ) {
                        addArticle(
                            title: $title
                            content: $content
                            complexity: $complexity
                            references: $references
                        ) {
                            id
                            title
                        }
                    }
                `;

                const variables = {
                    title: title.trim(),
                    content: content.trim(),
                    complexity,
                    references,
                };

                const apolloClient = getBrowserClient();

                const result = await apolloClient.mutate<{ addArticle: CreatedArticle }>({
                    mutation: ADD_ARTICLE,
                    variables,
                });

                const created = result.data?.addArticle;

                if (!created) {
                    throw new Error("Nie udało się utworzyć artykułu.");
                }

                setSuccess("Artykuł został utworzony.");
                router.push(`/articles/${created.id}`);
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