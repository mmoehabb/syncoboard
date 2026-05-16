import { ApiClient } from "./ApiClient";
import { AxiosRequestConfig } from "axios";
import { TaskStatus } from "@syncoboard/db";
import type { Task } from "@syncoboard/db";
import type {
  CreateTaskPayload,
  UpdateTaskStatusPayload,
  ListTasksResponse,
} from "@syncoboard/types";

export class TaskApi extends ApiClient {
  constructor(baseURL?: string) {
    super(baseURL ? `${baseURL}/api/tasks` : "/api/tasks");
  }

  public async addTask(
    payload: CreateTaskPayload,
    config?: AxiosRequestConfig,
  ): Promise<Task> {
    const response = await this.post<{ task: Task }>("", payload, config);
    return response.data.task;
  }

  public async updateTaskStatus(
    taskId: string,
    status: TaskStatus | string,
    config?: AxiosRequestConfig,
  ): Promise<Task> {
    const response = await this.patch<{ task: Task }>(
      `/${taskId}`,
      { status },
      config,
    );
    return response.data.task;
  }

  public async deleteTask(
    taskId: string,
    config?: AxiosRequestConfig,
  ): Promise<{ success: boolean }> {
    const response = await this.delete<{ success: boolean }>(
      `/${taskId}`,
      config,
    );
    return response.data;
  }
  public async listTasks(
    workspaceName: string,
    boardName: string,
    page: number = 1,
    limit: number = 5,
    config?: AxiosRequestConfig
  ): Promise<ListTasksResponse> {
    const response = await this.get<ListTasksResponse>("", {
      ...config,
      params: {
        ...config?.params,
        workspace: workspaceName,
        board: boardName,
        page,
        limit,
      },
    });
    return response.data;
  }
}

export const taskApi = new TaskApi();
