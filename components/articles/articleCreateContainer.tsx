"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import ArticleCreateForm from "./articleCreateForm/articleCreateForm";
import ArticleScientificCreateForm from "./articleCreateForm/articleScientificCreateForm";

export default function ArticleCreateContainer() {
    const [isScientificArticle, setIsScientificArticle] = useState(false);

    return (
        <>
            <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-white px-4 py-2 hover:bg-muted/50">
                <Checkbox
                    id="scientific-article"
                    checked={isScientificArticle}
                    onCheckedChange={(checked) => setIsScientificArticle(checked as boolean)}
                    className="h-5 w-5"
                />
                <label htmlFor="scientific-article" className="text-sm font-medium cursor-pointer">
                    Artykuł naukowy
                </label>
            </div>

            {isScientificArticle ? (
                <ArticleScientificCreateForm />
            ) : (
                <ArticleCreateForm />
            )}
        </>
    );
}
