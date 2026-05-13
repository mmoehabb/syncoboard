const fs = require('fs');
function replaceFile(file, replacer) {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log(`Updated ${file}`);
  }
}

replaceFile('apps/dashboard/src/app/plans/page.tsx', c => {
  let text = c.replace(/editingPlan as any/g, 'editingPlan as unknown as Partial<Plan>');
  text = text.replace(/e: any/g, 'e: unknown');
  return text;
});

replaceFile('apps/dashboard/src/app/login/page.tsx', c => {
  return c.replace(/e: any/g, 'e: unknown');
});

replaceFile('apps/dashboard/src/app/settings/page.tsx', c => {
  return c.replace(/e: any/g, 'e: unknown');
});

replaceFile('apps/dashboard/src/app/users/page.tsx', c => {
  return c.replace(/error: any/g, 'error: unknown');
});
