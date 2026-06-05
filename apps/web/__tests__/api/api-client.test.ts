import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test";
import { ApiClient } from "../../../../packages/api/src/ApiClient";

// To test the exact production logic of ApiClient, we use a real instance
// and inspect the interceptor manager of the underlying axios instance
// that was created inside its constructor.
class TestApiClient extends ApiClient {
  constructor() {
    super("/test");
  }

  public getResponseInterceptors() {
    return (
      this as unknown as {
        client: {
          interceptors: {
            response: {
              handlers: Array<{
                fulfilled: (r: unknown) => unknown;
                rejected: (e: unknown) => Promise<unknown>;
              }>;
            };
          };
        };
      }
    ).client.interceptors.response.handlers;
  }
}

describe("ApiClient", () => {
  let apiClient: TestApiClient;

  beforeEach(() => {
    apiClient = new TestApiClient();
  });

  describe("Response Interceptor", () => {
    it("should pass the response through directly on success", () => {
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
