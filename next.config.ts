import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  // React Compiler: automatic memoization, so components don't need hand-written useMemo/useCallback.
  // Next applies it only to files with JSX or hooks. Lint rules come from eslint-plugin-react-hooks.
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
