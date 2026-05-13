"use server";

import { prisma } from "@syncoboard/db";
import { auth } from "@/lib/auth";
import { TaskStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const validStatuses: TaskStatus[] = [
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "CHANGES_REQUESTED",
    "DONE",
    "CLOSED",
  ];

  if (!validStatuses.includes(status as unknown as TaskStatus /* eslint-disable-line no-restricted-syntax */)) {
    throw new Error(`Invalid task status: ${status}`);
  }

  if (!/^\d+$/.test(taskId)) {
    throw new Error("Invalid task ID format");
  }

  const existingTask = await prisma.task.findUnique({
    where: { id: BigInt(taskId) },
    include: { board: true },
  });

  if (!existingTask) {
    throw new Error("Task not found");
  }

  // Verify user has access to this board
  const boardMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: existingTask.boardId,
        userId: session.user.id,
      },
    },
  });

  if (!boardMember) {
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: existingTask.board.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!workspaceMember) {
      throw new Error("Unauthorized access to this task");
    }
  }

  const task = await prisma.task.update({
    where: { id: BigInt(taskId) },
    data: { status: status as TaskStatus /* eslint-disable-line no-restricted-syntax */ },
  });

  revalidatePath(`/dashboard/b/${existingTask.boardId}`, "page");
  return { ...task, id: task.id.toString() };
}

export async function addTask(boardId: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify user has access to this board
  const [boardMember, board] = await Promise.all([
    prisma.boardMember.findUnique({
      where: {
        boardId_userId: {
          boardId: boardId,
          userId: session.user.id,
        },
      },
    }),
    prisma.board.findUnique({
      where: { id: boardId },
    }),
  ]);

  if (!board) {
    throw new Error("Board not found");
  }

  // Check workspace access if not direct board member
  if (!boardMember) {
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!workspaceMember) {
      throw new Error("Unauthorized access to this board");
    }
  }

  const task = await prisma.task.create({
    data: {
      boardId: boardId,
      title,
      status: "TODO",
    },
  });

  revalidatePath(`/dashboard/b/${boardId}`, "page");
  return { ...task, id: task.id.toString() };
}

export async function deleteTask(taskId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  if (!/^\d+$/.test(taskId)) {
    throw new Error("Invalid task ID format");
  }

  const task = await prisma.task.findUnique({
    where: { id: BigInt(taskId) },
    include: { board: true },
  });

  if (!task) {
    throw new Error("Task not found");
  }

  // Verify user has access to this board
  const boardMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: task.boardId,
        userId: session.user.id,
      },
    },
  });

  if (!boardMember) {
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: task.board.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!workspaceMember) {
      throw new Error("Unauthorized access to delete this task");
    }
  }

  await prisma.task.delete({
    where: { id: BigInt(taskId) },
  });

  revalidatePath(`/dashboard/b/${task.boardId}`, "page");
  return { success: true };
}
