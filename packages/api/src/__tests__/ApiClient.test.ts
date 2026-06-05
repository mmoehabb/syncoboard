import { expect, test, describe, beforeEach, afterEach, mock } from "bun:test";
import { InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Build a minimal but real-enough axios mock that supports interceptors
// and an adapter, so we can verify the request flow end-to-end.
interface InterceptorHandler {
  fulfilled: (
    config: InternalAxiosRequestConfig,
  ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
  rejected?: (error: unknown) => unknown;
}

const buildMockAxios = () => {
  const requestHandlers: InterceptorHandler[] = [];
  const responseHandlers: InterceptorHandler[] = [];

  const runRequestInterceptors = async (
    config: InternalAxiosRequestConfig,
  ): Promise<InternalAxiosRequestConfig> => {
    let cfg = config;
    for (const handler of requestHandlers) {
      cfg = await handler.fulfilled(cfg);
    }
    return cfg;
  };

  const instance = {
    defaults: {} as {
      adapter?: (
        config: InternalAxiosRequestConfig,
      ) => Promise<AxiosResponse<unknown>>;
    },
    interceptors: {
      request: {
        use: (
          fulfilled: InterceptorHandler["fulfilled"],
          rejected?: InterceptorHandler["rejected"],
        ) => {
          requestHandlers.push({ fulfilled, rejected });
          return requestHandlers.length - 1;
        },
        handlers: requestHandlers,
      },
      response: {
        use: (
          fulfilled: (r: AxiosResponse) => AxiosResponse,
          rejected?: (e: unknown) => unknown,
        ) => {
          responseHandlers.push({ fulfilled, rejected });
          return responseHandlers.length - 1;
        },
        handlers: responseHandlers,
      },
    },
    get: async (url: string, config?: InternalAxiosRequestConfig) => {
      const merged: InternalAxiosRequestConfig = {
        ...(config ?? ({} as InternalAxiosRequestConfig)),
        url,
        method: "get",
        headers: (config?.headers ??
          {}) as InternalAxiosRequestConfig["headers"],
      } as InternalAxiosRequestConfig;
      const finalConfig = await runRequestInterceptors(merged);
      const adapter = instance.defaults.adapter;
      if (!adapter) {
        throw new Error("No adapter configured");
      }
      return adapter(finalConfig);
    },
    post: async (
      _url: string,
      _data?: unknown,
      config?: InternalAxiosRequestConfig,
    ) => {
      const merged: InternalAxiosRequestConfig = {
        ...(config ?? ({} as InternalAxiosRequestConfig)),
        method: "post",
        headers: (config?.headers ??
          {}) as InternalAxiosRequestConfig["headers"],
      } as InternalAxiosRequestConfig;
      const finalConfig = await runRequestInterceptors(merged);
      const adapter = instance.defaults.adapter;
      if (!adapter) {
        throw new Error("No adapter configured");
      }
      return adapter(finalConfig);
    },
    patch: async (
      _url: string,
      _data?: unknown,
      config?: InternalAxiosRequestConfig,
    ) => instance.get("", config),
    delete: async (_url: string, config?: InternalAxiosRequestConfig) =>
      instance.get("", config),
    put: async (
      _url: string,
      _data?: unknown,
      config?: InternalAxiosRequestConfig,
    ) => instance.get("", config),
  };

  return instance;
};

const sharedInstance = buildMockAxios();

mock.module("axios", () => ({
  default: { create: () => sharedInstance },
  create: () => sharedInstance,
}));

const { ApiClient, setGlobalApiToken } = await import("../ApiClient");

// Define the shape of our mock response data
interface MockResponseData {
  headers: Record<string, string | number | boolean>;
}

class MockApiClient extends ApiClient {
  constructor() {
    super();
    this.client.defaults.adapter = async (
      config: InternalAxiosRequestConfig,
    ): Promise<AxiosResponse<MockResponseData>> => {
      const headers = config.headers
        ? Object.fromEntries(Object.entries(config.headers))
        : {};

      return {
        data: { headers },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      } as AxiosResponse<MockResponseData>;
    };
  }

  public getTest(url: string) {
    return super.get<MockResponseData>(url);
  }
}

describe("ApiClient", () => {
  let client: MockApiClient;

  beforeEach(() => {
    client = new MockApiClient();
    setGlobalApiToken(null);
  });

  afterEach(() => {
    setGlobalApiToken(null);
  });

  describe("setGlobalApiToken", () => {
    test("should add Authorization header when token is set", async () => {
      setGlobalApiToken("test-token");
      const response = await client.getTest("/test");
      expect(response.data.headers?.Authorization).toBe("Bearer test-token");
    });

    test("should not add Authorization header when token is null", async () => {
      setGlobalApiToken(null);
      const response = await client.getTest("/test");
      expect(response.data.headers?.Authorization).toBeUndefined();
    });

    test("should change Authorization header when token is updated", async () => {
      setGlobalApiToken("token-1");
      const response1 = await client.getTest("/test");
      expect(response1.data.headers?.Authorization).toBe("Bearer token-1");

      setGlobalApiToken("token-2");
      const response2 = await client.getTest("/test");
      expect(response2.data.headers?.Authorization).toBe("Bearer token-2");
    });
  });
});
