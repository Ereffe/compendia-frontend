import { gql } from "@apollo/client";

import type { AccountUser } from "@/types/users";

export const CURRENT_USER_QUERY = gql`
    query CurrentUser {
        getCurrentUser {
            id
            name
            email
            role
        }
    }
`;

export const CHANGE_NAME_MUTATION = gql`
    mutation ChangeUsersName($name: String!) {
        changeUsersName(name: $name) {
            id
            name
        }
    }
`;

export const REQUEST_EMAIL_CHANGE_QUERY = gql`
    query RequestUsersEmailChange($email: String!) {
        requestUsersEmailChange(email: $email)
    }
`;

export const REQUEST_PASSWORD_CHANGE_QUERY = gql`
    query RequestUsersPasswordChange {
        requestUsersPasswordChange
    }
`;

export const CHANGE_EMAIL_MUTATION = gql`
    mutation ChangeUsersEmail($email: String!, $actionId: String!) {
        changeUsersEmail(email: $email, actionId: $actionId) {
            id
        }
    }
`;

export const CHANGE_PASSWORD_MUTATION = gql`
    mutation ChangeUsersPassword($password: String!, $actionId: String!) {
        changeUsersPassword(password: $password, actionId: $actionId) {
            id
        }
    }
`;

export type CurrentUserResponse = { getCurrentUser: AccountUser };
