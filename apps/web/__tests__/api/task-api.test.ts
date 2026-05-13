import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { mockAxiosInstance } from "../mocks/axios";
import type { AxiosInstance } from "axios";
import { TaskStatus } from "@prisma/client";

describe("TaskApi", () => {
  let taskApi: import("@syncoboard/api").TaskApi;

  beforeEach(async () => {
    mockAxiosInstance.post.mockReset();
    mockAxiosInstance.patch.mockReset();
    mockAxiosInstance.delete.mockReset();

    const { TaskApi: TaskApiClass } = await import("@syncoboard/api");
    taskApi = new TaskApiClass();
    // @ts-expect-error mocking axios
    taskApi["client"] = mockAxiosInstance;
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
        status: TaskStatus.TODO,
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
        status: TaskStatus.DONE,
      };

      mockAxiosInstance.patch.mockResolvedValueOnce({
        data: { task: mockTask },
      });

      const result = await taskApi.updateTaskStatus("1", TaskStatus.DONE);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        "/1",
        { status: TaskStatus.DONE },
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
