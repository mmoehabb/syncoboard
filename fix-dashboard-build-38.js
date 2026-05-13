const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/dashboard/src/app/plans/page.tsx', c => c.replace(/await api\.createPlan\(editingPlan\);/g, 'if (editingPlan) await api.createPlan(editingPlan as Exclude<typeof editingPlan, null> as Parameters<typeof api.createPlan>[0]);'));
