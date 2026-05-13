import { describe, it, expect, mock } from "bun:test";

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

// Now we can import from error.ts
import { API_ERRORS, apiError } from "../src/lib/api/error";

describe("API Error Utilities", () => {
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

    // Edge cases testing robustness of factory functions
    it("customNotFound should handle empty string", () => {
      const result = API_ERRORS.customNotFound("");
      expect(result).toEqual({
        error: " not found",
        status: 404,
      });
    });

    it("custom404 should handle empty string", () => {
      const result = API_ERRORS.custom404("");
      expect(result).toEqual({
        error: "",
        status: 404,
      });
    });

    it("customBadRequest should handle empty string", () => {
      const result = API_ERRORS.customBadRequest("");
      expect(result).toEqual({
        error: "",
        status: 400,
      });
    });
  });

  describe("apiError function", () => {
    it("should return a NextResponse with correct body and status", async () => {
      const errorDef = { error: "Test error", status: 418 };
      // @ts-expect-error mocking response
      const response = apiError(errorDef) ;

      expect(response.__isMock).toBe(true);
      expect(response.status).toBe(418);

      const body = await response.json();
      expect(body).toEqual({ error: "Test error" });
    });
  });
});
