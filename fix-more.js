const fs = require('fs');

function replace(file, replacer) {
  let content = fs.readFileSync(file, 'utf8');
  content = replacer(content);
  fs.writeFileSync(file, content);
}

replace('apps/web/src/app/settings/components/AddBoard.tsx', c => c.replace(/err as Error/g, 'err'));
replace('apps/web/src/app/settings/components/AddWorkspace.tsx', c => c.replace(/err as Error/g, 'err'));

replace('apps/web/src/context/CommandContext.tsx', c => c.replace(/as Partial<Session>/g, ''));
replace('apps/web/src/hooks/command.ts', c => {
  let res = c.replace(/as Record<string, string>/g, '');
  res = res.replace(/as Board\[\]/g, '');
  res = res.replace(/as Workspace\[\]/g, '');
  return res;
});

replace('apps/web/src/lib/actions/tasks.ts', c => {
  let res = c.replace(/as string/g, '');
  res = res.replace(/as TaskStatus/g, '');
  return res;
});

replace('apps/web/src/lib/auth.ts', c => {
  return c.replace(/as Adapter/g, '');
});
