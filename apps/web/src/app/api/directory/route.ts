import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import type { DirectoryResponse } from "@syncoboard/types";
import { hasValidSubscription } from "@/lib/api/with-subscription";

export async function GET(req: Request) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) {
    return apiError(API_ERRORS.customForbidden("Active subscription required"));
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get("path") || "/";

    // Standardize path: remove duplicate slashes, keep trailing slash only for root
    let normalizedPath = path.replace(/\/+/g, "/").trim();
    if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    if (!normalizedPath.startsWith("/")) {
      normalizedPath = "/" + normalizedPath;
    }

    const parts =
      normalizedPath === "/" ? [] : normalizedPath.split("/").filter(Boolean);

    // Root level: list all workspaces
    if (parts.length === 0) {
      const workspaces = await prisma.workspace.findMany({
        where: {
          members: {
            some: { userId: userId },
          },
        },
      });

      const response: DirectoryResponse = {
        path: normalizedPath,
        type: "Root",
        entries: workspaces.map((w) => ({
          id: w.id,
          name: w.name,
          type: "Workspace",
        })),
      };

      return NextResponse.json(response);
    }

    const workspaceName = parts[0];

    // Find the matching workspace case-insensitively, handling legacy spaces as hyphens
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { name: { equals: workspaceName, mode: "insensitive" } },
          {
            name: {
              equals: workspaceName.replace(/-/g, " "),
              mode: "insensitive",
            },
          },
        ],
        members: {
          some: { userId: userId },
        },
      },
    });

    if (!workspace) {
      return apiError(
        API_ERRORS.customNotFound(
          `Directory '${normalizedPath}' not found (Workspace missing or unauthorized)`,
        ),
      );
    }

    // Workspace level: list boards
    if (parts.length === 1) {
      const boards = await prisma.board.findMany({
        where: {
          workspaceId: workspace.id,
        },
      });

      // Filter out boards user doesn't have access to, if not workspace admin
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: workspace.id,
            userId: userId,
          },
        },
      });

      let accessibleBoards = boards;
      if (workspaceMember?.role !== "ADMIN") {
        // If not admin, verify board membership
        const boardMemberships = await prisma.boardMember.findMany({
          where: {
            userId: userId,
            boardId: { in: boards.map((b) => b.id) },
          },
        });
        const validBoardIds = new Set(boardMemberships.map((bm) => bm.boardId));
        accessibleBoards = boards.filter((b) => validBoardIds.has(b.id));
      }

      const response: DirectoryResponse = {
        path: normalizedPath,
        type: "Workspace",
        id: workspace.id,
        entries: accessibleBoards.map((b) => ({
          id: b.id,
          name: b.name,
          type: "Board",
        })),
      };

      return NextResponse.json(response);
    }

    const boardName = parts[1];

    // Find the matching board case-insensitively, handling legacy spaces as hyphens
    const board = await prisma.board.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [
          { name: { equals: boardName, mode: "insensitive" } },
          {
            name: {
              equals: boardName.replace(/-/g, " "),
              mode: "insensitive",
            },
          },
        ],
      },
    });

    if (!board) {
      return apiError(
        API_ERRORS.customNotFound(
          `Directory '${normalizedPath}' not found (Board missing)`,
        ),
      );
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: userId,
        },
      },
    });

    if (workspaceMember?.role !== "ADMIN") {
      const boardMember = await prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: board.id,
            userId: userId,
          },
        },
      });
      if (!boardMember) {
        return apiError(
          API_ERRORS.customForbidden(
            `Unauthorized access to board '${boardName}'`,
          ),
        );
      }
    }

    // Board level: list tasks
    if (parts.length === 2) {
      const allTasks = await prisma.task.findMany({
        where: {
          boardId: board.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const hasMoreByStatus: Record<string, boolean> = {};
      const groupedTasks: Record<string, typeof allTasks> = {};

      allTasks.forEach((t) => {
        if (!groupedTasks[t.status]) {
          groupedTasks[t.status] = [];
        }
        groupedTasks[t.status].push(t);
      });

      const tasksToReturn: typeof allTasks = [];

      Object.entries(groupedTasks).forEach(([status, tasksInStatus]) => {
        if (tasksInStatus.length > 5) {
          hasMoreByStatus[status] = true;
          tasksToReturn.push(...tasksInStatus.slice(0, 5));
        } else {
          hasMoreByStatus[status] = false;
          tasksToReturn.push(...tasksInStatus);
        }
      });

      const response: DirectoryResponse = {
        path: normalizedPath,
        type: "Board",
        id: board.id,
        entries: tasksToReturn.map((t) => ({
          id: t.id.toString(),
          name: `SYNC-${t.id}`,
          title: t.title,
          status: t.status,
          type: "Task",
        })),
        hasMoreByStatus,
      };

      return NextResponse.json(response);
    }

    const taskName = parts[2]; // SYNC-123

    if (!taskName.startsWith("SYNC-")) {
      return apiError(
        API_ERRORS.customNotFound(
          `Directory '${normalizedPath}' not found (Invalid task format)`,
        ),
      );
    }

    const taskIdStr = taskName.replace("SYNC-", "");

    if (!/^\d+$/.test(taskIdStr)) {
      return apiError(
        API_ERRORS.customNotFound(
          `Directory '${normalizedPath}' not found (Invalid task ID)`,
        ),
      );
    }

    const taskId = BigInt(taskIdStr);

    const task = await prisma.task.findUnique({
      where: { id: taskId, boardId: board.id },
    });

    if (!task) {
      return apiError(
        API_ERRORS.customNotFound(
          `Directory '${normalizedPath}' not found (Task missing)`,
        ),
      );
    }

    if (parts.length === 3) {
      const response: DirectoryResponse = {
        path: normalizedPath,
        type: "Task",
        id: task.id.toString(),
        entries: [], // Tasks are leaf nodes
      };
      return NextResponse.json(response);
    }

    return apiError(
      API_ERRORS.customNotFound(
        `Directory '${normalizedPath}' not found (Path too deep)`,
      ),
    );
  } catch (error) {
    console.error("Error fetching directory:", error);
    return apiError(API_ERRORS.customInternal("Failed to fetch directory"));
  }
}
