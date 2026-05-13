const fs = require('fs');
let c = fs.readFileSync('apps/web/__tests__/api-error.test.ts', 'utf8');
c = c.replace(/body: any/g, 'body: unknown');
fs.writeFileSync('apps/web/__tests__/api-error.test.ts', c);
