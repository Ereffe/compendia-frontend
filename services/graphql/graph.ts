import { graphql } from "./generated";

export const SCIENCE_ARTICLE_GRAPH_QUERY = graphql(`
    query GetScientificArticlesGraph($doi: String!, $level: Int!) {
        scienceArticleGraph(doi: $doi, level: $level) {
            nodes {
                doi
                title
                description
                authors
                url
            }
            edges {
                first
                second
            }
        }
    }
`);
