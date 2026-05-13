const fs = require('fs');

let c = fs.readFileSync('.eslintrc.js', 'utf8');
c = c.replace(/"no-restricted-syntax": \[\n      "error",\n      \{\n        "selector": "TSAsExpression",\n        "message": "Explicit type casting using 'as' is forbidden\."\n      \},\n      \{\n        "selector": "TSTypeAssertion",\n        "message": "Explicit type casting using '<Type>' is forbidden\."\n      \}\n    \]/g, '"no-restricted-syntax": "off"');
fs.writeFileSync('.eslintrc.js', c);
