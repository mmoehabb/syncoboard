const fs = require('fs');

const routePath = 'apps/web/src/app/api/tasks/[taskId]/route.ts';
let routeCode = fs.readFileSync(routePath, 'utf8');

// We only want to replace the `prisma.task.findFirst` call inside the GET method.
// So we find the text starting at export async function GET...
const startIndex = routeCode.indexOf('export async function GET(');
const searchCode = routeCode.substring(startIndex);

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

    const _boardMember = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: task.boardId,
          userId: userId,
        },
      },
    });

    if (!_boardMember) {
      const _workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: task.board.workspaceId,
            userId: userId,
          },
        },
      });

      if (_workspaceMember?.role !== "ADMIN") {
        return apiError(
          API_ERRORS.customForbidden("Unauthorized access to this board"),
        );
      }
    }`;

const replacedSearchCode = searchCode.replace(regex, replacement);
routeCode = routeCode.substring(0, startIndex) + replacedSearchCode;

fs.writeFileSync(routePath, routeCode, 'utf8');
