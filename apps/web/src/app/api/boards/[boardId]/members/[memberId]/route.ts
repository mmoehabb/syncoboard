import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ boardId: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId, memberId } = await params;

  // Check if current user is an admin of the board (or is removing themselves)
  const currentMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: session.user.id,
      },
    },
  });

  if (!currentMember || (currentMember.role !== "ADMIN" && session.user.id !== memberId)) {
    return NextResponse.json({ error: "Forbidden: Not an admin" }, { status: 403 });
  }

  // Cannot remove the last admin
  if (currentMember.role === "ADMIN") {
    const adminCount = await prisma.boardMember.count({
      where: {
        boardId,
        role: "ADMIN",
      },
    });

    const targetMember = await prisma.boardMember.findUnique({
       where: { boardId_userId: { boardId, userId: memberId } }
    });

    if (adminCount <= 1 && targetMember?.role === "ADMIN") {
      return NextResponse.json({ error: "Cannot remove the last admin of the board" }, { status: 400 });
    }
  }

  try {
    await prisma.boardMember.delete({
      where: {
        boardId_userId: {
          boardId,
          userId: memberId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
  }
}
