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
    mutation ChangeUsersEmail($actionId: String!) {
        changeUsersEmail(actionId: $actionId) {
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

export const USER_QUERY = graphql(`
    query User($id: String!) {
        getUserById(id: $id) {
            id
            name
            role
        }
    }
`);

export const ARTICLE_AUTHORS_QUERY = graphql(`
    query ArticleAuthors($size: Int!) {
        articles(page: 0, size: $size) {
            content {
                author {
                    id
                    name
                    role
                }
            }
        }
    }
`);
