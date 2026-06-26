import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check if current user is an admin of the board
  const currentMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: session.user.id,
      },
    },
  });

  if (!currentMember || currentMember.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Forbidden: Not an admin" },
      { status: 403 },
    );
  }

  // Find target user by email
  const targetUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!targetUser) {
    return NextResponse.json(
      { error: "User with this email not found" },
      { status: 404 },
    );
  }

  // Check if already a member
  const existingMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId: targetUser.id,
      },
    },
  });

  if (existingMember) {
    return NextResponse.json(
      { error: "User is already a member" },
      { status: 400 },
    );
  }

  // Check if there is already a pending invitation
  const existingInvite = await prisma.boardActivityLog.findFirst({
    where: {
      boardId,
      type: "INVITATION",
      targetUserId: targetUser.id,
      status: "PENDING",
    },
  });

  if (existingInvite) {
    return NextResponse.json(
      { error: "An invitation is already pending for this user" },
      { status: 400 },
    );
  }

  // Create invitation log
  const log = await prisma.boardActivityLog.create({
    data: {
      boardId,
      type: "INVITATION",
      actorId: session.user.id,
      targetUserId: targetUser.id,
      status: "PENDING",
    },
  });

  return NextResponse.json(log);
}
