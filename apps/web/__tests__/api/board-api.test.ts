import { describe, it, expect, beforeEach } from "bun:test";
import { mockAxiosInstance } from "../mocks/axios";
import type { AxiosInstance } from "axios";
import { BoardApi } from "../../../../packages/api/src/BoardApi";

describe("BoardApi", () => {
  let boardApi: BoardApi;

  beforeEach(() => {
    mockAxiosInstance.post.mockClear();
    mockAxiosInstance.delete.mockClear();
    mockAxiosInstance.put.mockClear();
    mockAxiosInstance.get.mockClear();
    boardApi = new BoardApi();
    boardApi["client"] = mockAxiosInstance as unknown as AxiosInstance;
  });

  describe("createBoard", () => {
    it("should call POST /api/boards with correct payload", async () => {
      const payload = {
        workspaceId: "ws_123",
        name: "New Board",
        repositoryName: "owner/repo",
        githubRepoId: "123456",
      };
      const mockBoard = { id: "board_123", ...payload };
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { board: mockBoard },
      });

      const result = await boardApi.createBoard(payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "",
        payload,
        undefined,
      );
      expect(result).toEqual(mockBoard);
    });

    it("should handle minimal payload", async () => {
      const payload = {
        workspaceId: "ws_123",
        name: "Minimal Board",
      };
      const mockBoard = { id: "board_456", ...payload };
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { board: mockBoard },
      });

      const result = await boardApi.createBoard(payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "",
        payload,
        undefined,
      );
      expect(result).toEqual(mockBoard);
    });

    it("should propagate errors", async () => {
      const payload = {
        workspaceId: "ws_123",
        name: "Error Board",
      };
      const error = new Error("Network Error");
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(boardApi.createBoard(payload)).rejects.toThrow(
        "Network Error",
      );
    });
  });

  describe("inviteMember", () => {
    it("should call POST /api/boards/:boardId/invites with correct payload", async () => {
      const boardId = "board_123";
      const email = "user@example.com";
      const mockResponse = { success: true };
      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await boardApi.inviteMember(boardId, email);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/${boardId}/invites`,
        { email },
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors", async () => {
      const boardId = "board_123";
      const email = "user@example.com";
      const error = new Error("Network Error");
      mockAxiosInstance.post.mockRejectedValueOnce(error);

      await expect(boardApi.inviteMember(boardId, email)).rejects.toThrow(
        "Network Error",
      );
    });
  });

  describe("removeMember", () => {
    it("should call DELETE /api/boards/:boardId/members/:memberId", async () => {
      const boardId = "board_123";
      const memberId = "user_123";
      const mockResponse = { message: "Member removed successfully" };
      mockAxiosInstance.delete.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await boardApi.removeMember(boardId, memberId);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        `/${boardId}/members/${memberId}`,
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors", async () => {
      const boardId = "board_123";
      const memberId = "user_123";
      const error = new Error("Delete failed");
      mockAxiosInstance.delete.mockRejectedValueOnce(error);

      await expect(boardApi.removeMember(boardId, memberId)).rejects.toThrow(
        "Delete failed",
      );
    });
  });

  describe("deleteBoard", () => {
    it("should call DELETE /api/boards with correct query parameters", async () => {
      const workspaceName = "my-workspace";
      const boardName = "my-board";
      const mockResponse = { message: "Board deleted successfully" };
      mockAxiosInstance.delete.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await boardApi.deleteBoard(workspaceName, boardName);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("", {
        params: {
          workspace: workspaceName,
          board: boardName,
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors", async () => {
      const workspaceName = "my-workspace";
      const boardName = "my-board";
      const error = new Error("Delete failed");
      mockAxiosInstance.delete.mockRejectedValueOnce(error);

      await expect(
        boardApi.deleteBoard(workspaceName, boardName),
      ).rejects.toThrow("Delete failed");
    });
  });

  describe("restoreBoard", () => {
    it("should call PUT /api/boards/restore with correct query parameters", async () => {
      const workspaceName = "my-workspace";
      const boardName = "my-board";
      const mockResponse = { message: "Board restored successfully" };
      mockAxiosInstance.put.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await boardApi.restoreBoard(workspaceName, boardName);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        "/restore",
        undefined,
        {
          params: {
            workspace: workspaceName,
            board: boardName,
          },
        },
      );
      expect(result).toEqual(mockResponse);
    });

    it("should propagate errors", async () => {
      const workspaceName = "my-workspace";
      const boardName = "my-board";
      const error = new Error("Restore failed");
      mockAxiosInstance.put.mockRejectedValueOnce(error);

      await expect(
        boardApi.restoreBoard(workspaceName, boardName),
      ).rejects.toThrow("Restore failed");
    });
  });

  describe("getDeletedBoards", () => {
    it("should call GET /api/boards/deleted", async () => {
      const mockResponse = {
        boards: [
          {
            id: "b1",
            name: "Deleted Board",
            workspaceName: "Workspace 1",
            repositoryName: "owner/repo",
            githubRepoId: "123",
            deletedAt: new Date(),
            daysLeftForPermDeletion: 90,
            timeLeftString: "3 months left",
          },
        ],
      };
      mockAxiosInstance.get.mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await boardApi.getDeletedBoards();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith("/deleted", undefined);
      expect(result).toEqual(mockResponse.boards);
    });

    it("should propagate errors", async () => {
      const error = new Error("Fetch failed");
      mockAxiosInstance.get.mockRejectedValueOnce(error);

      await expect(boardApi.getDeletedBoards()).rejects.toThrow("Fetch failed");
    });
  });
});
