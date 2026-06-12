import { describe, it, expect, beforeEach } from "bun:test";
import { NotificationApi } from "../NotificationApi";
import type { NotificationLog } from "@syncoboard/types";
import type { AxiosInstance, AxiosRequestConfig } from "axios";

describe("NotificationApi", () => {
  let notificationApi: NotificationApi;

  beforeEach(() => {
    notificationApi = new NotificationApi();
  });

  describe("getNotifications", () => {
    it("should call GET /api/notifications and return data", async () => {
      const mockLogs = [
        {
          id: "1",
          type: "TEST",
          message: "Test message",
        } as unknown as NotificationLog,
      ];

      let requestConfig: AxiosRequestConfig | undefined;
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async (config) => {
        requestConfig = config;
        return {
          data: { logs: mockLogs },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      };

      const result = await notificationApi.getNotifications();
      expect(result).toEqual({ logs: mockLogs });
      expect(requestConfig?.baseURL).toBe("http://localhost/api/notifications");
      expect(requestConfig?.url).toBe("");
      expect(requestConfig?.method).toBe("get");
    });

    it("should handle error if API call fails", async () => {
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async () => {
        throw new Error("API Error");
      };

      await expect(notificationApi.getNotifications()).rejects.toThrow(
        "API Error",
      );
    });
  });

  describe("getReadState", () => {
    it("should call GET /api/notifications/read and return lastRead string", async () => {
      let requestConfig: AxiosRequestConfig | undefined;
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async (config) => {
        requestConfig = config;
        return {
          data: { lastRead: "2023-01-01T00:00:00Z" },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      };

      const result = await notificationApi.getReadState();
      expect(result).toEqual({ lastRead: "2023-01-01T00:00:00Z" });
      expect(requestConfig?.baseURL).toBe("http://localhost/api/notifications");
      expect(requestConfig?.url).toBe("/read");
      expect(requestConfig?.method).toBe("get");
    });

    it("should call GET /api/notifications/read and return lastRead null", async () => {
      let requestConfig: AxiosRequestConfig | undefined;
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async (config) => {
        requestConfig = config;
        return {
          data: { lastRead: null },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      };

      const result = await notificationApi.getReadState();
      expect(result).toEqual({ lastRead: null });
      expect(requestConfig?.baseURL).toBe("http://localhost/api/notifications");
      expect(requestConfig?.url).toBe("/read");
      expect(requestConfig?.method).toBe("get");
    });

    it("should handle error if API call fails", async () => {
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async () => {
        throw new Error("API Error");
      };

      await expect(notificationApi.getReadState()).rejects.toThrow("API Error");
    });
  });

  describe("markAsRead", () => {
    it("should call POST /api/notifications/read and return success true", async () => {
      let requestConfig: AxiosRequestConfig | undefined;
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async (config) => {
        requestConfig = config;
        return {
          data: { success: true },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      };

      const result = await notificationApi.markAsRead();
      expect(result).toEqual({ success: true });
      expect(requestConfig?.baseURL).toBe("http://localhost/api/notifications");
      expect(requestConfig?.url).toBe("/read");
      expect(requestConfig?.method).toBe("post");
    });

    it("should call POST /api/notifications/read and return success false", async () => {
      let requestConfig: AxiosRequestConfig | undefined;
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async (config) => {
        requestConfig = config;
        return {
          data: { success: false },
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      };

      const result = await notificationApi.markAsRead();
      expect(result).toEqual({ success: false });
      expect(requestConfig?.baseURL).toBe("http://localhost/api/notifications");
      expect(requestConfig?.url).toBe("/read");
      expect(requestConfig?.method).toBe("post");
    });

    it("should handle error if API call fails", async () => {
      (
        notificationApi as unknown as { client: AxiosInstance }
      ).client.defaults.adapter = async () => {
        throw new Error("API Error");
      };

      await expect(notificationApi.markAsRead()).rejects.toThrow("API Error");
    });
  });
});
