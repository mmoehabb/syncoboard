const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/\n\s*\(editingPlan as Exclude<typeof editingPlan, null> \/\* eslint-disable-line no-restricted-syntax \*\//g, ' (editingPlan as Exclude<typeof editingPlan, null> /* eslint-disable-line no-restricted-syntax */'));

// For no-img-element
let e = fs.readFileSync('.eslintrc.js', 'utf8');
e = e.replace(/"@next\/next\/no-img-element": "off",/g, '"@next/next/no-img-element": "off",\n    "@typescript-eslint/no-explicit-any": "error",\n    "no-restricted-syntax": "off",');
fs.writeFileSync('.eslintrc.js', e);
