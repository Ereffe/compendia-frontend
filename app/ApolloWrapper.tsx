"use client";

import { ApolloNextAppProvider, ApolloClient, InMemoryCache } from "@apollo/client-integration-nextjs";
import { HttpLink } from "@apollo/client";

function makeClient() {
    const httpLink = new HttpLink({
        uri: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/graphql`,
    });

    return new ApolloClient({
        cache: new InMemoryCache(),
        link: httpLink,
    });
}

export function ApolloWrapper({ children }: Readonly<React.PropsWithChildren>) {
    return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
