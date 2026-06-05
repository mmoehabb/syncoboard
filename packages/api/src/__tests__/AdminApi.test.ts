import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { AdminApi, AdminChangePasswordRequest } from "../AdminApi";

describe("AdminApi", () => {
  let adminApi: AdminApi;
  let postSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    adminApi = new AdminApi();

    // We can spy on the protected method 'post' which is used by changePassword
    postSpy = spyOn(
      adminApi as unknown as {
        post: (url: string, data?: unknown) => Promise<unknown>;
      },
      "post",
    );
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
});
