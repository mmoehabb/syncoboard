import tseslint from "typescript-eslint";

const eslintConfig = tseslint.config(
  ...tseslint.configs.recommended,
  {
    ignores: ["dist/**", "build/**"],
  },
  {
    plugins: {
      "unused-imports": await import("eslint-plugin-unused-imports").then(
        (m) => m.default,
      ),
    },
    rules: {
      "unused-imports/no-unused-imports": "error",
      "no-unused-vars": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "error",
    },
  },
);

export default eslintConfig;
