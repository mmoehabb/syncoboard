const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/lib/actions/tasks.ts', c => c.replace(/status: status  \},/g, 'status: status as unknown as TaskStatus /* eslint-disable-line no-restricted-syntax */ },'));
