import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { mockAxiosInstance } from "../mocks/axios";
import type { AxiosInstance } from "axios";
import { BugApi as BugApiClass } from "../../../../packages/api/src/BugApi";

describe("BugApi", () => {
  let bugApi: import("@syncoboard/api").BugApi;

  beforeEach(async () => {
    mockAxiosInstance.post.mockReset();
    bugApi = new BugApiClass();
    // @ts-expect-error mocking axios
    bugApi["client"] = mockAxiosInstance;
  });

  afterEach(() => {
    mock.restore();
  });

  describe("reportBug", () => {
    it("should successfully report a bug", async () => {
      const mockResponse = {
        success: true,
        id: "bug-123",
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: mockResponse,
      });

      const payload = {
        message: "Test error",
        stack: "Test stack",
        url: "http://localhost/test",
      };

      const result = await bugApi.reportBug(payload);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        "",
        payload,
        undefined,
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle error when bug reporting fails", async () => {
      const mockError = new Error("Network error");
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      const payload = {
        message: "Test error",
      };

      await expect(bugApi.reportBug(payload)).rejects.toThrow("Network error");
    });
  });
});
