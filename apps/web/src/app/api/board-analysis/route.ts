import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { hasValidSubscription } from "@/lib/api/with-subscription";
import { serializeBigInt } from "@syncoboard/shared";

export async function GET(req: Request) {
  const userId = await getSessionOrPat();
  if (!userId) return apiError(API_ERRORS.UNAUTHORIZED);

  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) return apiError(API_ERRORS.customForbidden("Active subscription required"));

  try {
    const url = new URL(req.url);
    const boardId = url.searchParams.get("boardId");

    if (!boardId) return apiError(API_ERRORS.customBadRequest("boardId is required"));

    const boardMember = await prisma.boardMember.findUnique({
      where: { boardId_userId: { boardId, userId } }
    });

    if (!boardMember) {
      const board = await prisma.board.findUnique({ where: { id: boardId } });
      if (!board) return apiError(API_ERRORS.customNotFound("Board"));
      const workspaceMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId: board.workspaceId, userId } }
      });
      if (workspaceMember?.role !== "ADMIN") return apiError(API_ERRORS.customForbidden("Unauthorized"));
    }

    const tasks = await prisma.task.findMany({
      where: { boardId },
      include: { assignees: true }
    });

    return NextResponse.json(serializeBigInt({ tasks }));
  } catch (error) {
    return apiError(API_ERRORS.customInternal("Failed to fetch tasks for analysis"));
  }
}
