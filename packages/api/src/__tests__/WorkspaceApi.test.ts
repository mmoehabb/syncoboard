import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { WorkspaceApi } from "../WorkspaceApi";
import type { Workspace } from "@syncoboard/db";
import type { CreateWorkspacePayload } from "@syncoboard/types";

describe("WorkspaceApi", () => {
  let workspaceApi: WorkspaceApi;
  let postSpy: ReturnType<typeof spyOn>;
  let deleteSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    workspaceApi = new WorkspaceApi();

    postSpy = spyOn(
      workspaceApi as unknown as {
        post: (url: string, data?: unknown) => Promise<unknown>;
      },
      "post",
    );

    deleteSpy = spyOn(
      workspaceApi as unknown as {
        delete: (url: string, config?: unknown) => Promise<unknown>;
      },
      "delete",
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
      deleteSpy.mockRestore();
    });
  });

  describe("deleteWorkspace", () => {
    it("should call delete with the correct URL and params", async () => {
      const mockWorkspaceName = "test-workspace";
      const mockResponse = {
        data: { message: "Workspace deleted successfully" },
      };
      deleteSpy.mockResolvedValue(mockResponse);

      const result = await workspaceApi.deleteWorkspace(mockWorkspaceName);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith("", {
        params: {
          workspace: mockWorkspaceName,
        },
      });
      expect(result).toEqual({ message: "Workspace deleted successfully" });
    });

    it("should handle error if API call fails", async () => {
      const mockWorkspaceName = "test-workspace";
      const mockError = new Error("API Error");
      deleteSpy.mockRejectedValue(mockError);

      await expect(
        workspaceApi.deleteWorkspace(mockWorkspaceName),
      ).rejects.toBe(mockError);

      expect(deleteSpy).toHaveBeenCalledTimes(1);
      expect(deleteSpy).toHaveBeenCalledWith("", {
        params: {
          workspace: mockWorkspaceName,
        },
      });
    });
  });
});
