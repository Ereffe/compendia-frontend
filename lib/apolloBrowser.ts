import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";
import { SetContextLink } from "@apollo/client/link/context";
import { useAuthStore } from "@/hooks/stores/useAuthStore";

let client: ApolloClient | null = null;

function makeClient() {
    const httpLink = new HttpLink({ uri: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}/graphql` });

    const authLink = new SetContextLink(({ headers }, _) => {
        const accessToken = useAuthStore.getState().accessToken;
        return {
            headers: {
                ...headers,
                ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            },
        };
    });

    return new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
    });
}

export default function getBrowserClient() {
    if (!client) client = makeClient();
    return client;
}
