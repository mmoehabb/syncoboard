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
