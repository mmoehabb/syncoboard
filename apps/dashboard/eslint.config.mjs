import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
  {
    plugins: {
      "unused-imports": await import("eslint-plugin-unused-imports").then(
        (m) => m.default,
      ),
    },
    rules: {
      "unused-imports/no-unused-imports": "warn",
      "no-unused-vars": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];

export default eslintConfig;
