import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

const backendBaseUrl = process.env.BACKEND_URL;

const addArticleMutation = `
  mutation AddArticle($title: String!, $content: String!, $subjectId: Int!, $complexity: String!) {
    addArticle(title: $title, content: $content, subjectId: $subjectId, complexity: $complexity) {
      id
      title
    }
  }
`;

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    const accessToken = session?.accessToken;

    if (!accessToken || session?.error === "RefreshAccessTokenError") {
        return NextResponse.json({ error: "Brak aktywnej sesji." }, { status: 401 });
    }

    let body: {
        title?: string;
        content?: string;
        subjectId?: number;
        complexity?: string;
    };

    try {
        body = (await request.json()) as typeof body;
    } catch {
        return NextResponse.json({ error: "Nieprawidłowe dane żądania." }, { status: 400 });
    }

    const title = body.title?.trim();
    const content = body.content?.trim();
    const subjectId = body.subjectId;
    const complexity = body.complexity?.trim();

    if (!title || !content || !Number.isInteger(subjectId) || !complexity) {
        return NextResponse.json({ error: "Uzupełnij wszystkie pola formularza." }, { status: 400 });
    }

    const response = await fetch(`${backendBaseUrl}/graphql`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        body: JSON.stringify({
            query: addArticleMutation,
            variables: {
                title,
                content,
                subjectId,
                complexity,
            },
        }),
    });

    const payload = (await response.json()) as {
        data?: {
            addArticle?: {
                id: string;
                title: string;
            };
        };
        errors?: Array<{ message?: string }>;
    };

    const createdArticle = payload.data?.addArticle;

    if (!response.ok || !createdArticle) {
        return NextResponse.json(
            { error: payload.errors?.[0]?.message ?? "Nie udało się utworzyć artykułu." },
            { status: 502 }
        );
    }

    return NextResponse.json({ article: createdArticle });
}