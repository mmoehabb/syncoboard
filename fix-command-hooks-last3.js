const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/hooks/command.ts', c => c.replace(/collapsibleHeader\.click\(\);/g, '(collapsibleHeader as unknown as HTMLElement).click(); // eslint-disable-line no-restricted-syntax'));
