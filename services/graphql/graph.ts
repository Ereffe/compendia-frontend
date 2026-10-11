import { graphql } from "./generated";

// No `authors`: the backend fails with HTTP 500 for papers it loads from its database (backend issue 9).
export const SCIENCE_ARTICLE_GRAPH_QUERY = graphql(`
    query GetScientificArticlesGraph($doi: String!, $level: Int!) {
        scienceArticleGraph(doi: $doi, level: $level) {
            nodes {
                doi
                title
                description
                url
            }
            edges {
                first
                second
            }
        }
    }
`);
