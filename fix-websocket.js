const fs = require('fs');

let c = fs.readFileSync('packages/shared/src/websocket.ts', 'utf8');
c = c.replace(/as const;/g, ';');
fs.writeFileSync('packages/shared/src/websocket.ts', c);
