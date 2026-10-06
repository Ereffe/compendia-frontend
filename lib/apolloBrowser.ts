import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

import { publicBackendUrl } from "@/lib/config";

let client: ApolloClient | null = null;

/**
 * Browser client for PUBLIC queries only (search, citation graph). It sends no credentials.
 * Authenticated mutations go through Server Actions in `app/actions/*`.
 */
export default function getBrowserClient() {
    client ??= new ApolloClient({
        link: new HttpLink({ uri: `${publicBackendUrl}/graphql` }),
        cache: new InMemoryCache(),
    });
    return client;
}
