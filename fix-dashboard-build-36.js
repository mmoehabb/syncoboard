const fs = require('fs');

function replaceAll(file, replacer) {
  let c = fs.readFileSync(file, 'utf8');
  c = replacer(c);
  fs.writeFileSync(file, c);
}

replaceAll('apps/web/src/app/api/subscriptions/checkout/route.ts', c => c.replace(/error\.message/g, '(error instanceof Error ? error.message : "Unknown error")'));
