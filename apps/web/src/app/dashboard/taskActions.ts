"use server";

import { auth } from "@/lib/auth";
import { prisma, TaskStatus } from "@syncoboard/db";
import { serializeBigInt } from "@syncoboard/shared";

export async function getMoreTasks({
  boardId,
  status,
  skip,
  take = 10,
  searchQuery,
}: {
  boardId: string;
  status: TaskStatus;
  skip: number;
  take?: number;
  searchQuery?: string;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify access to the board
  const boardMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: boardId,
        userId: session.user.id,
      },
    },
    include: { board: true },
  });

  if (!boardMember) {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new Error("Board not found");
    }

    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!workspaceMember) {
      throw new Error("Unauthorized");
    }
  }

  const tasks = await prisma.task.findMany({
    where: {
      boardId,
      status,
      ...(searchQuery
        ? {
            title: {
              contains: searchQuery,
              mode: "insensitive",
            },
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { assignees: true, reviewers: true },
    skip,
    take,
  });

  return serializeBigInt(tasks);
}
