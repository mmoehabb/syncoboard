const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/context/CommandContext.tsx', c => c.replace(/activeBoardId: params\?\.boardId \|\| undefined,/g, 'activeBoardId: (params?.boardId as string) || undefined, // eslint-disable-line no-restricted-syntax'));
