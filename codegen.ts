import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
    schema: process.env.GRAPHQL_SCHEMA ?? "../compedia-backend/Compedia/src/main/resources/graphql/schema.graphqls",
    documents: ["services/graphql/**/*.ts", "!services/graphql/generated/**"],
    ignoreNoDocuments: true,
    generates: {
        "services/graphql/generated/": {
            preset: "client",
            presetConfig: {
                fragmentMasking: false,
            },
            config: {
                enumsAsTypes: true,
                useTypeImports: true,
                avoidOptionals: { field: true },
                skipTypename: true,
                scalars: { ID: "string" },
            },
        },
    },
};

export default config;
