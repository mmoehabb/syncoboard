import type { TaskStatus, Task } from "@syncoboard/db";

export interface CreateTaskPayload {
  boardId: string;
  title: string;
}

export interface UpdateTaskStatusPayload {
  status: TaskStatus;
}

export interface ListTasksResponse {
  tasksByStatus: Record<TaskStatus, Task[]>;
  hasMoreByStatus: Record<TaskStatus, boolean>;
}
