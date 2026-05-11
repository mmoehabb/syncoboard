import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";
import { emitWebSocketEvent } from "@/lib/api/websocket";

export async function DELETE(req: Request) {
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

    if (!workspaceName || !boardName) {
      return apiError(
        API_ERRORS.customBadRequest(
          "Workspace name and board name are required",
        ),
      );
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        name: workspaceName,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!workspace) {
      return apiError(API_ERRORS.customNotFound("Workspace"));
    }

    const board = await prisma.board.findFirst({
      where: {
        workspaceId: workspace.id,
        name: boardName,
        members: {
          some: {
            userId: userId,
          },
        },
      },
    });

    if (!board) {
      return apiError(API_ERRORS.customNotFound("Board"));
    }

    const member = await prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: board.id,
          userId: userId,
        },
      },
    });

    if (!member) {
      // This case should be rare now since we filter boards by membership above,
      // but it's safe to keep the explicit check.
      return apiError(
        API_ERRORS.customBadRequest("You are not a member of this board"),
      );
    }

    // Check if owner is leaving
    if (member.role === "ADMIN") {
      const otherAdmins = await prisma.boardMember.count({
        where: {
          boardId: board.id,
          role: "ADMIN",
          userId: { not: userId },
        },
      });

      if (otherAdmins === 0) {
        return apiError(
          API_ERRORS.customBadRequest(
            "You cannot leave the board as you are the only owner. Assign another owner first or delete the board.",
          ),
        );
      }
    }

    await prisma.$transaction([
      prisma.boardMember.delete({
        where: {
          boardId_userId: {
            boardId: board.id,
            userId: userId,
          },
        },
      }),
      prisma.boardActivityLog.create({
        data: {
          boardId: board.id,
          type: "MEMBER_LEAVE",
          actorId: userId,
        },
      }),
    ]);

    // Emit event
    await emitWebSocketEvent(`board_${board.id}`, "board_updated", {
      boardId: board.id,
    });

    return NextResponse.json({ message: "Successfully left the board" });
  } catch (error) {
    console.error("Error leaving board:", error);
    return apiError(API_ERRORS.customInternal("Failed to leave board"));
  }
}
