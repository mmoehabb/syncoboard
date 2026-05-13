const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts.lint = 'eslint "**/*.ts" "**/*.tsx"';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
