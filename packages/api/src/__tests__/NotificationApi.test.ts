import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { NotificationApi } from "../NotificationApi";
import type { NotificationLog } from "@syncoboard/types";
import type { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";

describe("NotificationApi", () => {
  let notificationApi: NotificationApi;
  let mock: MockAdapter;

  beforeEach(() => {
    notificationApi = new NotificationApi();
    // Use an explicitly cast unknown approach to access the underlying axios client instance
    const client = (notificationApi as unknown as { client: AxiosInstance })
      .client;
    mock = new MockAdapter(client);
  });

  afterEach(() => {
    mock?.restore();
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

      mock.onGet("").reply(200, { logs: mockLogs });

      const result = await notificationApi.getNotifications();
      expect(result).toEqual({ logs: mockLogs });

      // Verify the request details
      expect(mock.history.get.length).toBe(1);
      expect(mock.history.get[0].url).toBe("");
      expect(mock.history.get[0].baseURL).toMatch(/\/api\/notifications$/);
    });

    it("should handle error if API call fails", async () => {
      mock.onGet("").networkError();

      await expect(notificationApi.getNotifications()).rejects.toThrow();
    });
  });

  describe("getReadState", () => {
    it("should call GET /api/notifications/read and return lastRead string", async () => {
      mock.onGet("/read").reply(200, { lastRead: "2023-01-01T00:00:00Z" });

      const result = await notificationApi.getReadState();
      expect(result).toEqual({ lastRead: "2023-01-01T00:00:00Z" });

      // Verify the request details
      expect(mock.history.get.length).toBe(1);
      expect(mock.history.get[0].url).toBe("/read");
      expect(mock.history.get[0].baseURL).toMatch(/\/api\/notifications$/);
    });

    it("should call GET /api/notifications/read and return lastRead null", async () => {
      mock.onGet("/read").reply(200, { lastRead: null });

      const result = await notificationApi.getReadState();
      expect(result).toEqual({ lastRead: null });
    });

    it("should handle error if API call fails", async () => {
      mock.onGet("/read").networkError();

      await expect(notificationApi.getReadState()).rejects.toThrow();
    });
  });

  describe("markAsRead", () => {
    it("should call POST /api/notifications/read and return success true", async () => {
      mock.onPost("/read").reply(200, { success: true });

      const result = await notificationApi.markAsRead();
      expect(result).toEqual({ success: true });

      // Verify the request details
      expect(mock.history.post.length).toBe(1);
      expect(mock.history.post[0].url).toBe("/read");
      expect(mock.history.post[0].baseURL).toMatch(/\/api\/notifications$/);
    });

    it("should call POST /api/notifications/read and return success false", async () => {
      mock.onPost("/read").reply(200, { success: false });

      const result = await notificationApi.markAsRead();
      expect(result).toEqual({ success: false });
    });

    it("should handle error if API call fails", async () => {
      mock.onPost("/read").networkError();

      await expect(notificationApi.markAsRead()).rejects.toThrow();
    });
  });
});
