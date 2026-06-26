import { ApiClient } from "./ApiClient";
import type { CreateBoardPayload, DeletedBoard } from "@syncoboard/types";

export class BoardApi extends ApiClient {
  constructor() {
    super("/api/boards");
  }

  public async createBoard(payload: CreateBoardPayload): Promise<unknown> {
    const response = await this.post<{ board: unknown }>("", payload);
    return response.data.board;
  }

  public async deleteBoard(
    workspaceName: string,
    boardName: string,
  ): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>("", {
      params: {
        workspace: workspaceName,
        board: boardName,
      },
    });
    return response.data;
  }

  public async restoreBoard(
    workspaceName: string,
    boardName: string,
  ): Promise<{ message: string }> {
    const response = await this.put<{ message: string }>(
      "/restore",
      undefined,
      {
        params: {
          workspace: workspaceName,
          board: boardName,
        },
      },
    );
    return response.data;
  }

  public async getDeletedBoards(): Promise<DeletedBoard[]> {
    const response = await this.get<{ boards: DeletedBoard[] }>("/deleted");
    return response.data.boards;
  }

  public async updateBoardStatus(
    workspaceName: string,
    boardName: string,
    isActive: boolean,
  ): Promise<{ message: string; isActive: boolean }> {
    const response = await this.put<{ message: string; isActive: boolean }>(
      "/status",
      {
        workspaceName,
        boardName,
        isActive,
      },
    );
    return response.data;
  }

  public async leaveBoard(
    workspaceName: string,
    boardName: string,
  ): Promise<void> {
    await this.delete("/members/leave", {
      params: {
        workspace: workspaceName,
        board: boardName,
      },
    });
  }

  public async inviteMember(
    boardId: string,
    email: string,
  ): Promise<unknown> {
    const response = await this.post(`/${boardId}/invites`, { email });
    return response.data;
  }

  public async acceptInvite(inviteId: string): Promise<unknown> {
    const response = await this.client.post(`/api/invites/${inviteId}/accept`);
    return response.data;
  }

  public async rejectInvite(inviteId: string): Promise<unknown> {
    const response = await this.client.post(`/api/invites/${inviteId}/reject`);
    return response.data;
  }

  public async removeMember(
    boardId: string,
    memberId: string,
  ): Promise<{ message: string }> {
    const response = await this.delete<{ message: string }>(`/${boardId}/members/${memberId}`);
    return response.data;
  }

  public async syncBoard(
    workspaceName: string,
    boardName: string,
  ): Promise<{ message: string }> {
    const response = await this.post<{ message: string }>("/sync", {
      workspaceName,
      boardName,
    });
    return response.data;
  }
}

export const boardApi = new BoardApi();
