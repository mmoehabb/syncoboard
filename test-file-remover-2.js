const fs = require('fs');

function removeTypeCast(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/ as CommandCategory/g, '');
  content = content.replace(/ as Partial<Session>/g, '');
  content = content.replace(/ as Record<string, string>/g, '');
  content = content.replace(/ as Board\[\]/g, '');
  content = content.replace(/ as Workspace\[\]/g, '');
  content = content.replace(/ as Adapter/g, '');
  fs.writeFileSync(filePath, content);
}

removeTypeCast('apps/web/src/context/CommandContext.tsx');
removeTypeCast('apps/web/src/hooks/command.ts');
removeTypeCast('apps/web/src/lib/auth.ts');
removeTypeCast('apps/web/src/lib/command-registry.ts');
