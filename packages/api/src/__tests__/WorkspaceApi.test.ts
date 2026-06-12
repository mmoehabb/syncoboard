import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { WorkspaceApi } from "../WorkspaceApi";
import type { Workspace } from "@syncoboard/db";
import type { CreateWorkspacePayload } from "@syncoboard/types";

describe("WorkspaceApi", () => {
  let workspaceApi: WorkspaceApi;
  let postSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    workspaceApi = new WorkspaceApi();

    postSpy = spyOn(
      workspaceApi as unknown as {
        post: (url: string, data?: unknown) => Promise<unknown>;
      },
      "post",
    );
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  describe("createWorkspace", () => {
    it("should call post with the correct URL and payload", async () => {
      const mockPayload: CreateWorkspacePayload = {
        name: "test-workspace",
      };

      const mockWorkspace: Workspace = {
        id: "workspace-1",
        name: "test-workspace",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const mockResponse = { data: { workspace: mockWorkspace } };
      postSpy.mockResolvedValue(mockResponse);

      const result = await workspaceApi.createWorkspace(mockPayload);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("", mockPayload);
      expect(result).toEqual(mockWorkspace);
    });

    it("should handle error if API call fails", async () => {
      const mockPayload: CreateWorkspacePayload = {
        name: "test-workspace",
      };
      const mockError = new Error("API Error");
      postSpy.mockRejectedValue(mockError);

      await expect(workspaceApi.createWorkspace(mockPayload)).rejects.toBe(
        mockError,
      );

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("", mockPayload);
    });
  });
});
