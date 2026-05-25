const fs = require('fs');

const routePath = 'apps/web/src/app/api/tasks/[taskId]/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

// I'll replace the GET handler's logic exactly
const regex = /const task = await prisma\.task\.findFirst\([\s\S]*?if \(!task\) \{\n\s*return apiError\(API_ERRORS\.customNotFound\("Task"\)\);\n\s*\}/;

const replacement = `const task = await prisma.task.findFirst({
      where: {
        id: BigInt(taskId),
      },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
        assignees: true,
        reviewers: true,
        labels: true,
      },
    });

    if (!task) {
      return apiError(API_ERRORS.customNotFound("Task"));
    }

    const boardMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: task.boardId,
          userId: userId,
        },
      },
    });

    if (!boardMember) {
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: task.board.workspaceId,
            userId: userId,
          },
        },
      });

      if (workspaceMember?.role !== "ADMIN") {
        return apiError(API_ERRORS.customForbidden("Unauthorized access to this board"));
      }
    }`;

routeCode = routeCode.replace(regex, replacement);

fs.writeFileSync(routePath, routeCode, 'utf8');
