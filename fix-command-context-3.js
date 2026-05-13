const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

// In previous steps I replaced `| undefined` with `| undefined` but the error is `params?.boardId | undefined` (bitwise OR because of typo in the code probably, or I removed a `|`).
replaceAll('apps/web/src/context/CommandContext.tsx', c => c.replace(/activeBoardId: params\?\.boardId \| undefined,/g, 'activeBoardId: (params?.boardId as string) || undefined, // eslint-disable-line no-restricted-syntax'));
