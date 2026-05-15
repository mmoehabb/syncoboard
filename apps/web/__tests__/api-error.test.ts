import { describe, it, expect, mock, beforeAll } from "bun:test";
import type { API_ERRORS as ApiErrorsType } from "@syncoboard/api";
import type { ApiErrorDefinition } from "@syncoboard/types";

// Mock next/server BEFORE importing anything that might use it
mock.module("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
      __isMock: true,
    }),
  },
}));

// Mock @syncoboard/api and @syncoboard/types
mock.module("@syncoboard/api", () => ({
  API_ERRORS: {
    UNAUTHORIZED: { error: "Unauthorized", status: 401 },
    FORBIDDEN: { error: "Forbidden", status: 403 },
    BAD_REQUEST: { error: "Bad Request", status: 400 },
    NOT_FOUND: { error: "Not Found", status: 404 },
    INTERNAL_SERVER_ERROR: { error: "Internal Server Error", status: 500 },
    TOO_MANY_REQUESTS: { error: "Too Many Requests", status: 429 },
    customNotFound: (entity: string) => ({
      error: `${entity} not found`,
      status: 404,
    }),
    custom404: (message: string) => ({ error: message, status: 404 }),
    customBadRequest: (message: string) => ({ error: message, status: 400 }),
    customForbidden: (message: string) => ({ error: message, status: 403 }),
    customInternal: (message: string) => ({ error: message, status: 500 }),
    customUnauthorized: (message: string) => ({ error: message, status: 401 }),
    customTooManyRequests: (message: string) => ({
      error: message,
      status: 429,
    }),
  },
}));

// Mock @syncoboard/types just in case
mock.module("@syncoboard/types", () => ({}));

interface MockNextResponse {
  status: number;
  json: () => Promise<unknown>;
  __isMock: boolean;
}

describe("API Error Utilities", () => {
  let apiError: (errorDef: ApiErrorDefinition) => NextResponse;
  let API_ERRORS: typeof ApiErrorsType;

  beforeAll(async () => {
    const errorModule = await import("../src/lib/api/error");
    apiError = errorModule.apiError;
    API_ERRORS = errorModule.API_ERRORS;
  });

  describe("API_ERRORS Constants", () => {
    it("should have correct UNAUTHORIZED definition", () => {
      expect(API_ERRORS.UNAUTHORIZED).toEqual({
        error: "Unauthorized",
        status: 401,
      });
    });

    it("should have correct FORBIDDEN definition", () => {
      expect(API_ERRORS.FORBIDDEN).toEqual({
        error: "Forbidden",
        status: 403,
      });
    });

    it("should have correct BAD_REQUEST definition", () => {
      expect(API_ERRORS.BAD_REQUEST).toEqual({
        error: "Bad Request",
        status: 400,
      });
    });

    it("should have correct NOT_FOUND definition", () => {
      expect(API_ERRORS.NOT_FOUND).toEqual({
        error: "Not Found",
        status: 404,
      });
    });

    it("should have correct INTERNAL_SERVER_ERROR definition", () => {
      expect(API_ERRORS.INTERNAL_SERVER_ERROR).toEqual({
        error: "Internal Server Error",
        status: 500,
      });
    });

    it("should have correct TOO_MANY_REQUESTS definition", () => {
      expect(API_ERRORS.TOO_MANY_REQUESTS).toEqual({
        error: "Too Many Requests",
        status: 429,
      });
    });
  });

  describe("API_ERRORS Custom Helpers", () => {
    it("customNotFound should return formatted 404 error", () => {
      const result = API_ERRORS.customNotFound("User");
      expect(result).toEqual({
        error: "User not found",
        status: 404,
      });
    });

    it("custom404 should return formatted 404 error with message", () => {
      const result = API_ERRORS.custom404("Custom message");
      expect(result).toEqual({
        error: "Custom message",
        status: 404,
      });
    });

    it("customBadRequest should return formatted 400 error", () => {
      const result = API_ERRORS.customBadRequest("Invalid input");
      expect(result).toEqual({
        error: "Invalid input",
        status: 400,
      });
    });

    it("customForbidden should return formatted 403 error", () => {
      const result = API_ERRORS.customForbidden("Access denied");
      expect(result).toEqual({
        error: "Access denied",
        status: 403,
      });
    });

    it("customInternal should return formatted 500 error", () => {
      const result = API_ERRORS.customInternal("Something went wrong");
      expect(result).toEqual({
        error: "Something went wrong",
        status: 500,
      });
    });

    it("customUnauthorized should return formatted 401 error", () => {
      const result = API_ERRORS.customUnauthorized("Please log in");
      expect(result).toEqual({
        error: "Please log in",
        status: 401,
      });
    });

    it("customTooManyRequests should return formatted 429 error", () => {
      const result = API_ERRORS.customTooManyRequests("Rate limit exceeded");
      expect(result).toEqual({
        error: "Rate limit exceeded",
        status: 429,
      });
    });

    // Edge cases
    it("customNotFound should handle empty string", () => {
      const result = API_ERRORS.customNotFound("");
      expect(result.error).toBe(" not found");
    });

    it("customBadRequest should handle empty string", () => {
      const result = API_ERRORS.customBadRequest("");
      expect(result.error).toBe("");
    });
  });

  describe("apiError function", () => {
    it("should return a NextResponse with correct body and status", async () => {
      const errorDef: ApiErrorDefinition = { error: "Test error", status: 418 };
      const response = apiError(errorDef) as unknown as MockNextResponse;

      expect(response.__isMock).toBe(true);
      expect(response.status).toBe(418);

      const body = await response.json();
      expect(body).toEqual({ error: "Test error" });
    });

    it("should work with API_ERRORS constants", async () => {
      const response = apiError(
        API_ERRORS.NOT_FOUND,
      ) as unknown as MockNextResponse;
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({ error: "Not Found" });
    });

    it("should handle empty error message", async () => {
      const response = apiError({
        error: "",
        status: 400,
      }) as unknown as MockNextResponse;
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: "" });
    });

    it("should handle specialized status codes", async () => {
      const response = apiError({
        error: "No Content",
        status: 204,
      }) as unknown as MockNextResponse;
      expect(response.status).toBe(204);
    });
  });
});
