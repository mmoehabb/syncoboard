const fs = require('fs');

const routePath = 'apps/web/src/app/api/tasks/[taskId]/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

// I'll just change the variable names
routeCode = routeCode.replace('const boardMember = await prisma.boardMember.findUnique({', 'const _boardMember = await prisma.boardMember.findUnique({');
routeCode = routeCode.replace('if (!boardMember) {', 'if (!_boardMember) {');
routeCode = routeCode.replace('const workspaceMember = await prisma.workspaceMember.findUnique({', 'const _workspaceMember = await prisma.workspaceMember.findUnique({');
routeCode = routeCode.replace('if (workspaceMember?.role !== "ADMIN") {', 'if (_workspaceMember?.role !== "ADMIN") {');

fs.writeFileSync(routePath, routeCode, 'utf8');
