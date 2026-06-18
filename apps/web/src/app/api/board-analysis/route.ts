import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { serializeBigInt } from "@syncoboard/shared";

export async function GET(req: Request) {
  try {
    const userId = await getSessionOrPat();
    if (!userId) {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }

    const url = new URL(req.url);
    const boardId = url.searchParams.get("boardId");

    if (!boardId) {
      return apiError(
        API_ERRORS.customBadRequest("boardId parameter is required"),
      );
    }

    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board || !board.isActive) {
      return apiError(API_ERRORS.customNotFound("Board not found or inactive"));
    }

    // Check board authorization
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.workspaceId,
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
          API_ERRORS.customForbidden("Unauthorized access to this board"),
        );
      }
    }

    const tasks = await prisma.task.findMany({
      where: { boardId },
      include: {
        assignees: true,
      },
    });

    return NextResponse.json(serializeBigInt({ tasks }));
  } catch (error) {
    console.error("Error fetching board analysis tasks:", error);
    return apiError(
      API_ERRORS.customInternal("Failed to fetch board analysis tasks"),
    );
  }
}
