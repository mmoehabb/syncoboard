const fs = require('fs');

function replaceFile(file, replacer) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
  }
}

replaceFile('apps/tui/src/command-registry.ts', c => {
  return c.replace(/ as CommandCategory/g, '');
});

replaceFile('apps/dashboard/src/app/plans/page.tsx', c => {
  let res = c.replace(/editingPlan as unknown as Partial<Plan>/g, 'editingPlan');
  res = res.replace(/editingPlan as unknown as Omit<Plan, "id">/g, 'editingPlan');
  return res;
});

replaceFile('packages/api/src/error.ts', c => {
  return c.replace(/as CustomError/g, '');
});
