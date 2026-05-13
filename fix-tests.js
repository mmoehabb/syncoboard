const fs = require('fs');
const glob = require('glob');

const TSAsExpressionRegex = / as [a-zA-Z0-9_<>{}[\]\| \n]+/g;
// actually this is too complex and risky to do with regex. Let's write an AST transform or just modify the config.
// "Ensure to prevent `any` type and explicit type casting." -> We MUST fix the code, or modify the rule slightly if some casts are okay. But the user said "prevent explicit type casting", so we must remove all casts.

// Another approach: run eslint with a custom rule that removes the casts? No, that would break semantics if it's changing types in ways typescript doesn't like, leading to TS errors. But we can try just replacing `as T` with nothing, and if there are TS errors we fix them. Wait, if we replace `as any` with nothing, we might get TS errors, but since we are just doing type checking, we might just need to add type annotations.
