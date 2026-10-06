import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

import { publicBackendUrl } from "@/lib/config";

let client: ApolloClient | null = null;

export default function getBrowserClient() {
    client ??= new ApolloClient({
        link: new HttpLink({ uri: `${publicBackendUrl}/graphql` }),
        cache: new InMemoryCache(),
    });
    return client;
}
