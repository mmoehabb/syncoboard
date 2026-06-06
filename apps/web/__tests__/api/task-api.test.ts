import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { mockAxiosInstance } from "../mocks/axios";
import type { AxiosInstance } from "axios";
import { TaskApi } from "../../../../packages/api/src/TaskApi";

describe("TaskApi", () => {
  let taskApi: import("@syncoboard/api").TaskApi;

  beforeEach(() => {
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.patch.mockReset();
    mockAxiosInstance.delete.mockReset();

    taskApi = new TaskApi();
    taskApi["client"] = mockAxiosInstance as unknown as AxiosInstance;
  });

  afterEach(() => {
    mock.restore();
  });

  describe("addTask", () => {
    it("should successfully add a task", async () => {
      const mockTask = {
        id: "1",
        boardId: "board-1",
        title: "Test Task",
        status: "TODO",
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { task: mockTask },
      });

      const payload = {
        boardId: "board-1",
        title: "Test Task",
      };

      const result = await taskApi.addTask(payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "",
        payload,
        undefined,
      );
      expect(result).toEqual(mockTask);
    });

    it("should handle error when adding a task fails", async () => {
      const mockError = new Error("Network error");
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      const payload = {
        boardId: "board-1",
        title: "Test Task",
      };

      await expect(taskApi.addTask(payload)).rejects.toThrow("Network error");
    });
  });

  describe("updateTaskStatus", () => {
    it("should successfully update a task status", async () => {
      const mockTask = {
        id: "1",
        status: "DONE",
      };

      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: { task: mockTask },
      });

      const result = await taskApi.updateTaskStatus("1", "DONE");

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/1",
        { status: "DONE" },
        undefined,
      );
      expect(result).toEqual(mockTask);
    });
  });

  describe("deleteTask", () => {
    it("should successfully delete a task", async () => {
      mockAxiosInstance.delete.mockResolvedValueOnce({
        data: { success: true },
      });

      const result = await taskApi.deleteTask("1");

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith("/1", undefined);
      expect(result).toEqual({ success: true });
    });
  });
});
