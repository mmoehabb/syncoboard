import { ApiClient } from "./ApiClient";
import { AxiosRequestConfig } from "axios";
import type { Workspace } from "@syncoboard/db";
import type {
  WorkspaceWithBoards,
  CreateWorkspacePayload,
} from "@syncoboard/types";

export class WorkspaceApi extends ApiClient {
  constructor(baseURL?: string) {
    super(baseURL ? `${baseURL}/api/workspaces` : "/api/workspaces");
  }

  public async getUserWorkspaces(
    includeBoards: boolean = false,
    config?: AxiosRequestConfig,
  ): Promise<WorkspaceWithBoards[] | Partial<Workspace>[]> {
    const response = await this.get<{ workspaces: WorkspaceWithBoards[] }>("", {
      ...config,
      params: {
        ...config?.params,
        includeBoards: includeBoards ? "true" : "false",
      },
    });
    return response.data.workspaces;
  }

  public async createWorkspace(
    payload: CreateWorkspacePayload,
  ): Promise<Workspace> {
    const response = await this.post<{ workspace: Workspace }>("", payload);
    return response.data.workspace;
  }

  public async deleteWorkspace(
    workspaceName: string,
  ): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>("", {
      params: {
        workspace: workspaceName,
      },
    });
    return response.data;
  }

  public async restoreWorkspace(
    workspaceName: string,
  ): Promise<{ message: string }> {
    const response = await this.put<{ message: string }>(
      "/restore",
      undefined,
      {
        params: {
          workspace: workspaceName,
        },
      },
    );
    return response.data;
  }

  public async updateWorkspaceStatus(
    workspaceName: string,
    isActive: boolean,
  ): Promise<{ message: string; isActive: boolean }> {
    const response = await this.put<{ message: string; isActive: boolean }>(
      "/status",
      {
        workspaceName,
        isActive,
      },
    );
    return response.data;
  }
}

export const workspaceApi = new WorkspaceApi();
