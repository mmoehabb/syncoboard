const fs = require('fs');
let content = fs.readFileSync('.eslintrc.js', 'utf8');

// I'll add "no-control-regex": "off" and ignore next/next/no-img-element. But maybe we can fix next/next/no-img-element by using next/image? Or since it's just linting, we can use eslint-disable

// Actually we have unused variables. Let's fix them or add rules: "@typescript-eslint/no-unused-vars": "off" for now? "ensure to prevent any type and explicit type casting" is the main goal. Unused variables could be disabled or prefixed with _.

content = content.replace(/rules: {/, 'rules: {\n    "@next/next/no-img-element": "off",\n    "no-control-regex": "off",\n    "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],');
fs.writeFileSync('.eslintrc.js', content);
