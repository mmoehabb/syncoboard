import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { emitWebSocketEvent } from "@/lib/api/websocket";

export async function GET(req: Request) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  try {
    const userBoards = await prisma.boardMember.findMany({
      where: { userId: userId },
      select: { boardId: true },
    });

    const boardIds = userBoards.map((b) => b.boardId);

    // Fetch logs: either targeted to the user, or related to boards the user is in (but not targeted to anyone else specifically, except invitations targeted to them)
    const logs = await prisma.boardActivityLog.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          {
            boardId: { in: boardIds },
            OR: [{ type: { not: "INVITATION" } }, { targetUserId: userId }],
          },
        ],
      },
      include: {
        actor: { select: { name: true, email: true, image: true } },
        targetUser: { select: { name: true, email: true, image: true } },
        board: {
          select: { name: true, workspace: { select: { name: true } } },
        },
        task: { select: { title: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return apiError(API_ERRORS.customInternal("Failed to fetch notifications"));
  }
}

export async function POST(req: Request) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  try {
    const body = await req.json();
    const { action, logId } = body;

    if (!logId || !["ACCEPT", "DECLINE"].includes(action)) {
      return apiError(API_ERRORS.customBadRequest("Invalid action or log ID"));
    }

    const log = await prisma.boardActivityLog.findUnique({
      where: { id: logId },
      include: { board: true },
    });

    if (!log || log.targetUserId !== userId || log.type !== "INVITATION") {
      return apiError(API_ERRORS.customForbidden("Invalid invitation"));
    }

    if (action === "ACCEPT") {
      await prisma.$transaction([
        prisma.boardMember.create({
          data: {
            boardId: log.boardId,
            userId: userId,
            role: "MEMBER",
          },
        }),
        prisma.boardActivityLog.update({
          where: { id: logId },
          data: { status: "ACCEPTED" },
        }),
        prisma.boardActivityLog.create({
          data: {
            boardId: log.boardId,
            type: "MEMBER_JOIN",
            actorId: userId,
          },
        }),
      ]);
    } else {
      await prisma.boardActivityLog.update({
        where: { id: logId },
        data: { status: "DECLINED" },
      });
    }

    if (action === "ACCEPT") {
      await emitWebSocketEvent(`board_${log.boardId}`, "board_updated", {
        boardId: log.boardId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating invitation:", error);
    return apiError(API_ERRORS.customInternal("Failed to update invitation"));
  }
}
