const fs = require('fs');

const routePath = 'apps/web/src/app/api/tasks/[taskId]/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

// The replacement was accidentally done on the DELETE handler (line 144) instead of the GET handler (line 260).
// I will just git checkout the file to reset it, then apply correctly.
