import { graphql } from "./generated";

export const CURRENT_USER_QUERY = graphql(`
    query CurrentUser {
        getCurrentUser {
            id
            name
            email
            role
        }
    }
`);

export const CHANGE_NAME_MUTATION = graphql(`
    mutation ChangeUsersName($name: String!) {
        changeUsersName(name: $name) {
            id
            name
        }
    }
`);

export const REQUEST_EMAIL_CHANGE_QUERY = graphql(`
    query RequestUsersEmailChange($email: String!) {
        requestUsersEmailChange(email: $email)
    }
`);

export const REQUEST_PASSWORD_CHANGE_QUERY = graphql(`
    query RequestUsersPasswordChange {
        requestUsersPasswordChange
    }
`);

export const CHANGE_EMAIL_MUTATION = graphql(`
    mutation ChangeUsersEmail($email: String!, $actionId: String!) {
        changeUsersEmail(email: $email, actionId: $actionId) {
            id
        }
    }
`);

export const CHANGE_PASSWORD_MUTATION = graphql(`
    mutation ChangeUsersPassword($password: String!, $actionId: String!) {
        changeUsersPassword(password: $password, actionId: $actionId) {
            id
        }
    }
`);
