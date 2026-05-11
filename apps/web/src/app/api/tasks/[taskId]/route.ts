import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { TaskStatus } from "@prisma/client";
import { hasValidSubscription } from "@/lib/api/with-subscription";
import { emitWebSocketEvent } from "@/lib/api/websocket";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) {
    return apiError(API_ERRORS.customForbidden("Active subscription required"));
  }

  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;

    if (!/^\d+$/.test(taskId)) {
      return apiError(API_ERRORS.customBadRequest("Invalid task ID format"));
    }

    const body = await req.json();
    const { status } = body;

    if (!status) {
      return apiError(API_ERRORS.customBadRequest("Status is required"));
    }

    const validStatuses: TaskStatus[] = [
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "CHANGES_REQUESTED",
      "DONE",
      "CLOSED",
    ];

    if (!validStatuses.includes(status as TaskStatus)) {
      return apiError(
        API_ERRORS.customBadRequest(`Invalid task status: ${status}`),
      );
    }

    const existingTask = await prisma.task.findFirst({
      where: {
        id: BigInt(taskId),
        board: {
          OR: [
            { members: { some: { userId: userId } } },
            {
              workspace: {
                members: { some: { userId: userId, role: "ADMIN" } },
              },
            },
          ],
        },
      },
      include: { board: true },
    });

    if (!existingTask) {
      return apiError(API_ERRORS.customNotFound("Task"));
    }

    const task = await prisma.task.update({
      where: { id: BigInt(taskId) },
      data: { status: status as TaskStatus },
    });

    if (existingTask.status !== status) {
      await prisma.boardActivityLog.create({
        data: {
          boardId: existingTask.boardId,
          type: "TASK_UPDATE",
          actorId: userId,
          taskId: BigInt(taskId),
        },
      });
    }

    // Emit event
    await emitWebSocketEvent(`board_${existingTask.boardId}`, "task_updated", {
      taskId,
    });

    return NextResponse.json(
      { task: { ...task, id: task.id.toString() } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating task status:", error);
    return apiError(API_ERRORS.customInternal("Failed to update task status"));
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) {
    return apiError(API_ERRORS.customForbidden("Active subscription required"));
  }

  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;

    if (!/^\d+$/.test(taskId)) {
      return apiError(API_ERRORS.customBadRequest("Invalid task ID format"));
    }

    const task = await prisma.task.findFirst({
      where: {
        id: BigInt(taskId),
        board: {
          OR: [
            { members: { some: { userId: userId } } },
            {
              workspace: {
                members: { some: { userId: userId, role: "ADMIN" } },
              },
            },
          ],
        },
      },
      include: { board: true },
    });

    if (!task) {
      return apiError(API_ERRORS.customNotFound("Task"));
    }

    await prisma.task.delete({
      where: { id: BigInt(taskId) },
    });

    // Emit event
    await emitWebSocketEvent(`board_${task.boardId}`, "task_updated", {
      taskId,
      deleted: true,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting task:", error);
    return apiError(API_ERRORS.customInternal("Failed to delete task"));
  }
}
