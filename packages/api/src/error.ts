import type { ApiErrorDefinition } from "@syncoboard/types";

export const API_ERRORS = {
  UNAUTHORIZED: { error: "Unauthorized", status: 401 },
  FORBIDDEN: { error: "Forbidden", status: 403 },
  BAD_REQUEST: { error: "Bad Request", status: 400 },
  NOT_FOUND: { error: "Not Found", status: 404 },
  INTERNAL_SERVER_ERROR: {
    error: "Internal Server Error",
    status: 500,
  },
  TOO_MANY_REQUESTS: {
    error: "Too Many Requests",
    status: 429,
  },

  // Custom helpers
  customNotFound: (entity: string): ApiErrorDefinition => ({
    error: `${entity} not found`,
    status: 404,
  }),
  custom404: (message: string): ApiErrorDefinition => ({
    error: message,
    status: 404,
  }),
  customBadRequest: (message: string): ApiErrorDefinition => ({
    error: message,
    status: 400,
  }),
  customForbidden: (message: string): ApiErrorDefinition => ({
    error: message,
    status: 403,
  }),
  customInternal: (message: string): ApiErrorDefinition => ({
    error: message,
    status: 500,
  }),
  customUnauthorized: (message: string): ApiErrorDefinition => ({
    error: message,
    status: 401,
  }),
  customTooManyRequests: (message: string): ApiErrorDefinition => ({
    error: message,
    status: 429,
  }),
};
