import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { UserApi } from "../UserApi";
import { AxiosInstance } from "axios";

describe("UserApi", () => {
  let userApi: UserApi;

  beforeEach(() => {
    userApi = new UserApi();
  });

  describe("updateLastOnline", () => {
    it("should call post with the correct URL including baseURL", async () => {
      let requestConfig: any = null;
      const client = (userApi as unknown as { client: AxiosInstance }).client;
      client.defaults.adapter = async (config) => {
        requestConfig = config;
        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      };

      await userApi.updateLastOnline();

      expect(requestConfig).not.toBeNull();
      // Test that the method is POST
      expect(requestConfig.method).toBe("post");
      // The resolved URL should combine baseURL and the specific path
      expect(requestConfig.baseURL).toMatch(/\/api\/user$/);
      expect(requestConfig.url).toBe("/activity");
    });

    it("should handle error if API call fails", async () => {
      const client = (userApi as unknown as { client: AxiosInstance }).client;
      const mockError = new Error("API Error");
      client.defaults.adapter = async () => {
        throw mockError;
      };

      await expect(userApi.updateLastOnline()).rejects.toThrow("API Error");
    });
  });
});
