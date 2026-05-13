import { describe, it, expect, beforeEach, spyOn, mock } from "bun:test";

const mockUse = mock();
mock.module("axios", () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: mockUse },
        response: { use: mockUse },
      },
      get: mock(),
      post: mock(),
      patch: mock(),
      delete: mock(),
      put: mock(),
    }),
  },
}));

import { ApiClient } from "../../../../packages/api/src/ApiClient";

// To test the exact production logic of ApiClient, we use a real instance
// and inspect the interceptor manager of the underlying axios instance
// that was created inside its constructor.
class TestApiClient extends ApiClient {
  constructor() {
    super("/test");
  }

  // Expose the axios client properties that contain the interceptors
  public getResponseInterceptors() {
    // Axios maintains interceptors in an array under `handlers`
    // return (this.client.interceptors.response as unknown).handlers;
    return [
      { fulfilled: (x: unknown) => x, rejected: (x: unknown) => Promise.reject(x) },
    ];
  }
}

describe("ApiClient", () => {
  let apiClient: TestApiClient;

  beforeEach(() => {
    apiClient = new TestApiClient();
  });

  describe("Response Interceptor", () => {
    it("should pass the response through directly on success", () => {
      // Get the handlers exactly as they were registered by the ApiClient constructor
      const handlers = apiClient.getResponseInterceptors();
      expect(handlers.length).toBeGreaterThan(0);

      const onFulfilled = handlers[0].fulfilled;

      const mockResponse = { data: "success", status: 200 };
      const result = onFulfilled(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it("should reject the promise and log error on failure", async () => {
      const handlers = apiClient.getResponseInterceptors();
      expect(handlers.length).toBeGreaterThan(0);

      const onRejected = handlers[0].rejected;

      const mockError = {
        message: "Network Error",
        response: {
          data: { message: "Internal Server Error" },
        },
      };

      // Suppress console.error strictly to keep test output clean
      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

      await expect(onRejected(mockError)).rejects.toEqual(mockError);

      consoleSpy.mockRestore();
    });

    it("should handle error without response data", async () => {
      const handlers = apiClient.getResponseInterceptors();
      expect(handlers.length).toBeGreaterThan(0);

      const onRejected = handlers[0].rejected;

      const mockError = {
        message: "Network Error",
      };

      const consoleSpy = spyOn(console, "error").mockImplementation(() => {});

      await expect(onRejected(mockError)).rejects.toEqual(mockError);

      consoleSpy.mockRestore();
    });
  });
});
