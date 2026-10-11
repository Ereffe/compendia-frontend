import { defineConfig } from "eslint/config";
import sonarjs from "eslint-plugin-sonarjs";

import baseConfig from "./eslint.config.mjs";

export default defineConfig([
  ...baseConfig,
  sonarjs.configs.recommended,
  {
    rules: {
      "jsx-a11y/prefer-tag-over-role": "warn",
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],
    },
  },
]);
