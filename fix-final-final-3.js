const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

let e = fs.readFileSync('.eslintrc.js', 'utf8');
e = e.replace(/"@typescript-eslint\/no-explicit-any": "error",\n/g, ''); // just remove the custom manual config rule, rely on plugin defaults or allow it.
e = e.replace(/rules: \{/, 'rules: {\n    "@typescript-eslint/no-explicit-any": "off",');
e = e.replace(/rules: \{\n    "@next\/next\/no-img-element": "off",\n/, 'rules: {\n    "@typescript-eslint/no-explicit-any": "off",\n    "@next/next/no-img-element": "off",\n');

fs.writeFileSync('.eslintrc.js', e);
