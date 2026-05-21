import { HttpLink, ApolloClient as ApolloClientBase, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";

const graphqlUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/graphql`;

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
    return new ApolloClientBase({
        cache: new InMemoryCache(),
        link: new HttpLink({
            uri: graphqlUrl,
        }),
    });
});

export default getClient;
