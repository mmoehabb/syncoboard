import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";
import { emitWebSocketEvent } from "@/lib/api/websocket";
import {
  WEBSOCKET_EVENTS,
  encodeBoardRoomName,
  serializeBigInt,
} from "@syncoboard/shared";

export async function POST(req: Request) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) {
    return apiError(API_ERRORS.customForbidden("Active subscription required"));
  }

  try {
    const body = await req.json();
    const { boardId, title } = body;

    if (!boardId || !title) {
      return apiError(
        API_ERRORS.customBadRequest("Board ID and title are required"),
      );
    }

    // Verify user has access to this board
    const [boardMember, board] = await Promise.all([
      prisma.boardMember.findUnique({
        where: {
          boardId_userId: {
            boardId: boardId,
            userId: userId,
          },
        },
      }),
      prisma.board.findUnique({
        where: { id: boardId },
      }),
    ]);

    if (!board) {
      return apiError(API_ERRORS.customNotFound("Board"));
    }

    // Check workspace access if not direct board member
    if (!boardMember) {
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: board.workspaceId,
            userId: userId,
          },
        },
      });

      if (workspaceMember?.role !== "ADMIN") {
        return apiError(
          API_ERRORS.customForbidden("Unauthorized access to this board"),
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        boardId: boardId,
        title,
        status: "TODO",
      },
    });

    // Emit event
    await emitWebSocketEvent(`board_${boardId}`, "task_updated", {
      taskId: task.id.toString(),
    });

    // Make bigints serializable
    return NextResponse.json(serializeBigInt({ task }), { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return apiError(API_ERRORS.customInternal("Failed to create task"));
  }
}


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
    const workspaceName = url.searchParams.get("workspace");
    const boardName = url.searchParams.get("board");
    const pageParam = url.searchParams.get("page") || "1";
    const limitParam = url.searchParams.get("limit") || "5";

    if (!workspaceName || !boardName) {
      return apiError(
        API_ERRORS.customBadRequest("workspace and board parameters are required")
      );
    }

    const page = parseInt(pageParam, 10);
    const limit = parseInt(limitParam, 10);

    if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1) {
      return apiError(API_ERRORS.customBadRequest("Invalid page or limit"));
    }

    // Find workspace
    const workspace = await prisma.workspace.findFirst({
      where: {
        OR: [
          { name: { equals: workspaceName, mode: "insensitive" } },
          { name: { equals: workspaceName.replace(/-/g, " "), mode: "insensitive" } },
        ],
        members: {
          some: { userId: userId },
        },
      },
    });

    if (!workspace) {
      return apiError(API_ERRORS.customNotFound("Workspace not found or unauthorized"));
    }

    // Find board
    const board = await prisma.board.findFirst({
      where: {
        workspaceId: workspace.id,
        OR: [
          { name: { equals: boardName, mode: "insensitive" } },
          { name: { equals: boardName.replace(/-/g, " "), mode: "insensitive" } },
        ],
      },
    });

    if (!board) {
      return apiError(API_ERRORS.customNotFound("Board not found"));
    }

    // Check board authorization
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
        return apiError(API_ERRORS.customForbidden("Unauthorized access to this board"));
      }
    }

    const skip = (page - 1) * limit;

    // We can fetch tasks for each status
    // In Prisma schema: TaskStatus has TODO, IN_PROGRESS, IN_REVIEW, CHANGES_REQUESTED, DONE, CLOSED
    const statuses = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "CHANGES_REQUESTED",
      "DONE",
      "CLOSED",
    ];

    const tasksByStatus: Record<string, any[]> = {};
    const hasMoreByStatus: Record<string, boolean> = {};

    // Run queries in parallel
    await Promise.all(
      statuses.map(async (status) => {
        const tasksForStatus = await prisma.task.findMany({
          where: {
            boardId: board.id,
            status: status as any,
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit + 1, // Fetch one extra to determine if there's more
        });

        if (tasksForStatus.length > limit) {
          hasMoreByStatus[status] = true;
          tasksByStatus[status] = tasksForStatus.slice(0, limit);
        } else {
          hasMoreByStatus[status] = false;
          tasksByStatus[status] = tasksForStatus;
        }
      })
    );

    const response = {
      tasksByStatus,
      hasMoreByStatus,
    };

    return NextResponse.json(serializeBigInt(response));

  } catch (error) {
    console.error("Error fetching tasks:", error);
    return apiError(API_ERRORS.customInternal("Failed to fetch tasks"));
  }
}
