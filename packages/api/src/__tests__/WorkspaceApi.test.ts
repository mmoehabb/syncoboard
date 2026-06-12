import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { WorkspaceApi } from "../WorkspaceApi";

describe("WorkspaceApi", () => {
  let workspaceApi: WorkspaceApi;
  let deleteSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    workspaceApi = new WorkspaceApi();

    deleteSpy = spyOn(
      workspaceApi as unknown as {
        delete: (url: string, config?: unknown) => Promise<unknown>;
      },
      "delete",
    );
  });

  afterEach(() => {
    deleteSpy.mockRestore();
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
