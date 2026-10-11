import "server-only";

import { HttpLink } from "@apollo/client";
import { ApolloClient, InMemoryCache, registerApolloClient } from "@apollo/client-integration-nextjs";

import { serverBackendUrl } from "@/lib/config";

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
