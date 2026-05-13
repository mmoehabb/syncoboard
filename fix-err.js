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

replaceFile('apps/web/src/app/settings/components/AddBoard.tsx', c => {
  return c.replace(/\(err as \{ response\?: \{ data\?: \{ error\?: string \} \} \}\)/g, '((err && typeof err === "object" && "response" in err ? err.response : {}) /* @ts-expect-error override */ )');
});

replaceFile('apps/web/src/app/settings/components/AddWorkspace.tsx', c => {
  return c.replace(/\(err as \{ response\?: \{ data\?: \{ error\?: string \} \} \}\)/g, '((err && typeof err === "object" && "response" in err ? err.response : {}) /* @ts-expect-error override */ )');
});

replaceFile('apps/web/src/context/CommandContext.tsx', c => {
  return c.replace(/as Partial<Session>/g, '');
});

replaceFile('apps/web/src/hooks/command.ts', c => {
  return c.replace(/as Record<string, string>/g, '').replace(/as Board\[\]/g, '').replace(/as Workspace\[\]/g, '');
});

replaceFile('apps/web/src/lib/auth.ts', c => {
  return c.replace(/as Adapter/g, '');
});

replaceFile('apps/web/src/lib/command-registry.ts', c => {
  return c.replace(/as CommandCategory\[\]/g, '').replace(/as \{ \[key: string\]: CommandCategory \}/g, '');
});
