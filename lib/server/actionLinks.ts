import "server-only";

import { isValidActionId } from "@/lib/account";
import { isActionLinkGone } from "@/lib/graphqlErrors";
import { getServerClient } from "@/lib/server/apollo";
import { ACTION_DETAILS_QUERY } from "@/services/graphql/users";

export type ActionLinkType = "CHANGE_EMAIL" | "CHANGE_PASSWORD";

export async function isActionLinkValid(actionId: string, type: ActionLinkType): Promise<boolean> {
    if (!isValidActionId(actionId)) return false;
    try {
        const { data } = await getServerClient().query({
            query: ACTION_DETAILS_QUERY,
            variables: { actionId },
            fetchPolicy: "no-cache",
        });
        return data?.getActionDetails.type === type;
    } catch (error) {
        if (isActionLinkGone(error)) return false;
        throw error;
    }
}
