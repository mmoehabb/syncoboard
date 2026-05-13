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

replaceFile('apps/tui/src/command-registry.ts', c => {
  return c.replace(/as Array<.*>/g, '').replace(/as CommandDefinition\[\]/g, '').replace(/as CommandCategory\[\]/g, '').replace(/as { \[key: string\]: CommandCategory }/g, '');
});

replaceFile('apps/tui/src/app.tsx', c => {
  return c.replace(/as {.*}/g, '');
});

replaceFile('apps/tui/src/cli.tsx', c => {
  return c.replace(/as {.*}/g, '');
});
