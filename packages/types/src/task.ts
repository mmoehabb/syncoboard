import type { TaskStatus } from "@syncoboard/db";

export interface CreateTaskPayload {
  boardId: string;
  title: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
}

export interface ListTasksResponse {
  tasksByStatus: Record<string, any[]>;
  hasMoreByStatus: Record<string, boolean>;
}
