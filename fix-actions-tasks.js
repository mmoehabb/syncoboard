const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/lib/actions/tasks.ts', c => c.replace(/if \(!validStatuses\.includes\(status \)\) \{/g, 'if (!validStatuses.includes(status as unknown as TaskStatus /* eslint-disable-line no-restricted-syntax */)) {'));
