import { AxiosResponse } from "axios";
import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { AdminApi, AdminChangePasswordRequest } from "../AdminApi";
import { BugReport } from "@syncoboard/db";

describe("AdminApi", () => {
  let adminApi: AdminApi;
  let postSpy: ReturnType<typeof spyOn>;
  let getSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    adminApi = new AdminApi();
    adminApi = new AdminApi();

    // We can spy on the protected method 'post' which is used by changePassword
    postSpy = spyOn(
      adminApi as unknown as {
        post: (url: string, data?: unknown) => Promise<unknown>;
      },
      "post",
    );

    getSpy = spyOn(
      adminApi as unknown as {
        get: (url: string, data?: unknown) => Promise<unknown>;
      },
      "get",
    ).mockResolvedValue({
      data: {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      },
    } as unknown as AxiosResponse);
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  describe("changePassword", () => {
    it("should call post with the correct URL and data", async () => {
      const mockData: AdminChangePasswordRequest = {
        currentPassword: "old",
        newPassword: "new",
      };
      const mockResponse = { data: { success: true } };
      postSpy.mockResolvedValue(mockResponse);

      const result = await adminApi.changePassword(mockData);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("/auth/password", mockData);
      expect(result).toEqual({ success: true });
    });

    it("should handle error if API call fails", async () => {
      const mockData: AdminChangePasswordRequest = {
        currentPassword: "old",
        newPassword: "new",
      };
      const mockError = new Error("API Error");
      postSpy.mockRejectedValue(mockError);

      await expect(adminApi.changePassword(mockData)).rejects.toBe(mockError);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("/auth/password", mockData);
    });

    it("should allow partial data like only newPassword", async () => {
      const mockData = { newPassword: "new" } as AdminChangePasswordRequest;
      const mockResponse = { data: { success: true } };
      postSpy.mockResolvedValue(mockResponse);

      const result = await adminApi.changePassword(mockData);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("/auth/password", mockData);
      expect(result).toEqual({ success: true });
    });

    it("should allow empty data payload", async () => {
      const mockData = {} as AdminChangePasswordRequest;
      const mockResponse = { data: { success: false } };
      postSpy.mockResolvedValue(mockResponse);

      const result = await adminApi.changePassword(mockData);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("/auth/password", mockData);
      expect(result).toEqual({ success: false });
    });
  });

  describe("getBugReports", () => {
    it("should fetch reports without query params when no params are provided", async () => {
      await adminApi.getBugReports();
      expect(getSpy).toHaveBeenCalledWith("/reports");
    });

    it("should append page parameter correctly", async () => {
      await adminApi.getBugReports({ page: 2 });
      expect(getSpy).toHaveBeenCalledWith("/reports?page=2");
    });

    it("should append limit parameter correctly", async () => {
      await adminApi.getBugReports({ limit: 20 });
      expect(getSpy).toHaveBeenCalledWith("/reports?limit=20");
    });

    it("should append search parameter correctly", async () => {
      await adminApi.getBugReports({ search: "bug" });
      expect(getSpy).toHaveBeenCalledWith("/reports?search=bug");
    });

    it("should append multiple parameters correctly", async () => {
      await adminApi.getBugReports({ page: 2, limit: 15, search: "error" });
      const calls = getSpy.mock.calls;
      expect(calls.length).toBe(1);
      const url = calls[0][0];

      // Since URLSearchParams order is deterministic (insertion order)
      // but let's be robust and parse the URL just in case, or match standard order
      expect(url).toContain("page=2");
      expect(url).toContain("limit=15");
      expect(url).toContain("search=error");
      expect(url.startsWith("/reports?")).toBe(true);
    });

    it("should return the data from the API response", async () => {
      const mockResponse = {
        data: [{ id: "report1", title: "Test bug" }],
        total: 1,
        page: 1,
        limit: 10,
      };

      getSpy.mockResolvedValueOnce({
        data: mockResponse,
      } as unknown as AxiosResponse);

      const result = await adminApi.getBugReports();
      expect(result).toEqual(
        mockResponse as unknown as {
          data: BugReport[];
          total: number;
          page: number;
          limit: number;
        },
      );
    });
  });
});
