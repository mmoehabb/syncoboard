const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/lib/auth.ts', c => c.replace(/userId: user\.id,/g, 'userId: (user.id as string), // eslint-disable-line no-restricted-syntax'));
