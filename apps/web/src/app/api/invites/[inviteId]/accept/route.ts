import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId } = await params;

  const invite = await prisma.boardActivityLog.findUnique({
    where: { id: inviteId },
  });

  if (!invite || invite.type !== "INVITATION" || invite.status !== "PENDING") {
    return NextResponse.json(
      { error: "Invalid or expired invitation" },
      { status: 400 },
    );
  }

  if (invite.targetUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Update invitation status
      await tx.boardActivityLog.update({
        where: { id: inviteId },
        data: { status: "ACCEPTED" },
      });

      // Add to board members
      await tx.boardMember.create({
        data: {
          boardId: invite.boardId,
          userId: session.user.id,
          role: "MEMBER",
        },
      });

      // Also fetch the board to get the workspaceId, and add to workspace if not already a member
      const board = await tx.board.findUnique({
        where: { id: invite.boardId },
      });
      if (board) {
        const wsMember = await tx.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId: board.workspaceId,
              userId: session.user.id,
            },
          },
        });
        if (!wsMember) {
          await tx.workspaceMember.create({
            data: {
              workspaceId: board.workspaceId,
              userId: session.user.id,
              role: "MEMBER",
            },
          });
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
