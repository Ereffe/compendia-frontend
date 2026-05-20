export type ArticleSearchItem = {
    title: string;
    publishedAt: string;
    author: string;
    id: string;
};

export const filterArticles = (articles: ArticleSearchItem[], query: string): ArticleSearchItem[] => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
        return articles;
    }

    return articles.filter((article) => {
        const haystack = [article.title, article.author].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
    });
};

export const getNoResultsMessage = (): string => "Nie znaleziono artykułów dla tego zapytania.";

export const getSearchPlaceholder = (): string => "Szukaj artykułów...";

export const getSearchButtonLabel = (): string => "Szukaj artykułów, tematów lub autorów";

export const getSearchExample = (): string => "Przykład: optymalizacja SQL, planowanie procesów, listy wiązane...";

export const getTotalResultsLabel = (count: number): string => {
    if (count === 0) return "Brak wyników";
    if (count === 1) return "1 wynik";
    return `${count} wyniki`;
};
