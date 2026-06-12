import { AxiosResponse } from "axios";
import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { TaskApi } from "../TaskApi";
import type { ListTasksResponse } from "@syncoboard/types";

describe("TaskApi", () => {
  let taskApi: TaskApi;
  let getSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    taskApi = new TaskApi();

    // Mock the inherited protected `get` method
    getSpy = spyOn(
      taskApi as unknown as {
        get: (url: string, config?: unknown) => Promise<unknown>;
      },
      "get",
    ).mockResolvedValue({
      data: {
        tasks: [],
        total: 0,
      },
    } as unknown as AxiosResponse);
  });

  afterEach(() => {
    getSpy.mockRestore();
  });

  describe("listTasks", () => {
    it("should call get with default parameters correctly", async () => {
      const mockResponseData: ListTasksResponse = { tasks: [], total: 0 };
      getSpy.mockResolvedValue({
        data: mockResponseData,
      } as unknown as AxiosResponse);

      const result = await taskApi.listTasks("my-workspace", "my-board");

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith("", {
        params: {
          workspace: "my-workspace",
          board: "my-board",
          page: 1,
          limit: 5,
        },
      });
      expect(result).toEqual(mockResponseData);
    });

    it("should call get with custom parameters correctly", async () => {
      const mockResponseData: ListTasksResponse = {
        tasks: [{ id: "t1" } as any],
        total: 1,
      };
      getSpy.mockResolvedValue({
        data: mockResponseData,
      } as unknown as AxiosResponse);

      const result = await taskApi.listTasks("my-workspace", "my-board", 3, 20);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith("", {
        params: {
          workspace: "my-workspace",
          board: "my-board",
          page: 3,
          limit: 20,
        },
      });
      expect(result).toEqual(mockResponseData);
    });

    it("should merge extra AxiosRequestConfig and extra params", async () => {
      const mockResponseData: ListTasksResponse = { tasks: [], total: 0 };
      getSpy.mockResolvedValue({
        data: mockResponseData,
      } as unknown as AxiosResponse);

      const extraConfig = {
        headers: { Authorization: "Bearer token" },
        params: { extraFilter: "urgent" },
      };

      const result = await taskApi.listTasks(
        "my-workspace",
        "my-board",
        2,
        10,
        extraConfig,
      );

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith("", {
        headers: { Authorization: "Bearer token" },
        params: {
          extraFilter: "urgent",
          workspace: "my-workspace",
          board: "my-board",
          page: 2,
          limit: 10,
        },
      });
      expect(result).toEqual(mockResponseData);
    });

    it("should handle error if API call fails", async () => {
      const mockError = new Error("Network Error");
      getSpy.mockRejectedValue(mockError);

      await expect(taskApi.listTasks("ws", "bd")).rejects.toBe(mockError);

      expect(getSpy).toHaveBeenCalledTimes(1);
      expect(getSpy).toHaveBeenCalledWith("", {
        params: {
          workspace: "ws",
          board: "bd",
          page: 1,
          limit: 5,
        },
      });
    });
  });
});
