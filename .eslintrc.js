module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/out/**"
  ],
  rules: {
    "@next/next/no-img-element": "off",
    "no-control-regex": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
    "no-restricted-syntax": [
      "error",
      {
        "selector": "TSAsExpression",
        "message": "Explicit type casting using 'as' is forbidden."
      },
      {
        "selector": "TSTypeAssertion",
        "message": "Explicit type casting using '<Type>' is forbidden."
      }
    ]
  }
};
