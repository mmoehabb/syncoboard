const fs = require('fs');

const routePath = 'apps/web/src/app/api/tasks/[taskId]/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

const regex = /const task = await prisma\.task\.findFirst\(\{\n\s*where: \{\n\s*id: BigInt\(taskId\),\n\s*board: \{\n\s*OR: \[\n\s*\{ members: \{ some: \{ userId: userId \} \} \},\n\s*\{\n\s*workspace: \{\n\s*members: \{ some: \{ userId: userId, role: "ADMIN" \} \},\n\s*\},\n\s*\},\n\s*\],\n\s*\},\n\s*\},\n\s*include: \{\n\s*board: true,\n\s*assignees: true,\n\s*reviewers: true,\n\s*labels: true,\n\s*\},\n\s*\}\);/;

const replacement = `const task = await prisma.task.findFirst({
      where: {
        id: BigInt(taskId),
        board: {
          OR: [
            { members: { some: { userId: userId } } },
            {
              workspace: {
                members: { some: { userId: userId, role: "ADMIN" } },
              },
            },
          ],
        },
      },
      include: {
        board: true,
        assignees: true,
        reviewers: true,
        labels: true,
      },
    });

    if (!task) {
      return apiError(API_ERRORS.customForbidden("Not authorized to access this task"));
    }`;

routeCode = routeCode.replace(regex, replacement);

// The issue from the comment is actually broader:
// "A user can fetch a task if he/she a member or admin of the tasks board."
// Wait, my GET request already checks for:
// { members: { some: { userId: userId } } } (user is member of board)
// OR workspace admin.
// BUT the PR comment states:
// "A user can fetch a task if he/she a member or admin of the tasks board."
// My check is for: 1. Board member. 2. Workspace ADMIN.
// The comment implies they should be "member or admin of the tasks board."
