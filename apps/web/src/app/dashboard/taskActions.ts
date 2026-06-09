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
  assignee,
  reviewer,
  startDate,
  endDate,
}: {
  boardId: string;
  status: TaskStatus;
  skip: number;
  take?: number;
  searchQuery?: string;
  assignee?: string;
  reviewer?: string;
  startDate?: string;
  endDate?: string;
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

  const whereClause: any = {
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
  };

  if (assignee) {
    whereClause.assignees = {
      some: { id: assignee },
    };
  }

  if (reviewer) {
    whereClause.reviewers = {
      some: { id: reviewer },
    };
  }

  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    whereClause.OR = [{ createdAt: dateFilter }, { updatedAt: dateFilter }];
  }

  const tasks = await prisma.task.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: { assignees: true, reviewers: true },
    skip,
    take,
  });

  return serializeBigInt(tasks);
}
