const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/\n\s*\(editingPlan as Exclude<typeof editingPlan, null> \/\* eslint-disable-line no-restricted-syntax \*\/\s*as Parameters<typeof api.createPlan>\[0\]\)/g, '(editingPlan as Parameters<typeof api.createPlan>[0])'));
