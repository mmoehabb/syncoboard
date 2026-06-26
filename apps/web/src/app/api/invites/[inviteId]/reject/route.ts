import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ inviteId: string }> }
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
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 400 });
  }

  if (invite.targetUserId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.boardActivityLog.update({
      where: { id: inviteId },
      data: { status: "DECLINED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to decline invitation" }, { status: 500 });
  }
}
