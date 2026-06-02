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

export const TASK_STATUSES: TaskStatus[] = [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "CHANGES_REQUESTED",
  "DONE",
  "CLOSED",
];

export const TASK_STATUS_ORDER: Record<TaskStatus, number> = {
  TODO: 0,
  IN_PROGRESS: 1,
  IN_REVIEW: 2,
  CHANGES_REQUESTED: 3,
  DONE: 4,
  CLOSED: 5,
};

export const TASK_STATUS_GROUPS: Array<{
  title: string;
  status: TaskStatus;
  color: string;
}> = [
  { title: "TODO", status: "TODO", color: "text-syntax-grey" },
  { title: "IN PROGRESS", status: "IN_PROGRESS", color: "text-neon-pulse" },
  { title: "IN REVIEW", status: "IN_REVIEW", color: "text-git-green" },
  {
    title: "CHANGES REQUESTED",
    status: "CHANGES_REQUESTED",
    color: "text-red-400",
  },
  { title: "DONE", status: "DONE", color: "text-git-green opacity-50" },
  { title: "CLOSED", status: "CLOSED", color: "text-syntax-grey opacity-50" },
];
