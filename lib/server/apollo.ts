import "server-only";

import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache, registerApolloClient } from "@apollo/client-integration-nextjs";

import { serverBackendUrl } from "@/lib/config";

// registerApolloClient creates one client (and cache) per request, so results never leak
// between users or go stale across requests.
export const { getClient: getServerClient } = registerApolloClient(
    () =>
        new ApolloClient({
            cache: new InMemoryCache(),
            link: new HttpLink({
                uri: `${serverBackendUrl}/graphql`,
                fetchOptions: { cache: "no-store" },
            }),
        }),
);
