const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/lib/command-registry.ts', c => {
  let r = c.replace(/\(err\)\.message/g, '(err instanceof Error ? err.message : "")');
  r = r.replace(/err\.message/g, '(err instanceof Error ? err.message : "")');
  return r;
});
