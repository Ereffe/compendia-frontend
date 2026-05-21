import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { gql } from "@apollo/client";
import getClient from "@/app/ApolloClient";

import { authOptions } from "@/lib/auth";


const addArticleMutation = `
  mutation AddArticle($title: String!, $content: String!, $complexity: String!, $references: [String!]!) {
    addArticle(title: $title, content: $content, complexity: $complexity, references: $references) {
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
        complexity?: string;
        references?: Array<string>;
    };

    try {
        body = (await request.json()) as typeof body;
    } catch {
        return NextResponse.json({ error: "Nieprawidłowe dane żądania." }, { status: 400 });
    }

    const title = body.title?.trim();
    const content = body.content?.trim();
    const complexity = body.complexity?.trim();
    const references = body.references ?? [];

    if (!title || !content || !complexity) {
        return NextResponse.json({ error: "Uzupełnij wszystkie pola formularza." }, { status: 400 });
    }

    try {
        const client = getClient();
        const res = await client.mutate<{ addArticle: GraphQLArticle }>({
            mutation: gql`
                ${addArticleMutation}
            `,
            variables: { title, content, complexity, references },
            context: { headers: { Authorization: `Bearer ${accessToken}` } },
        });

        const createdArticle = res.data?.addArticle;
        if (!createdArticle) {
            return NextResponse.json({ error: "Nie udało się utworzyć artykułu." }, { status: 502 });
        }

        return NextResponse.json({ article: createdArticle });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message ?? "Nie udało się utworzyć artykułu." }, { status: 502 });
    }
}