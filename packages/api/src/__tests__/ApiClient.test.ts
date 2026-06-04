import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { ApiClient, setGlobalApiToken } from "../ApiClient";
import { InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Define the shape of our mock response data
interface MockResponseData {
  headers: Record<string, string | number | boolean>;
}

class MockApiClient extends ApiClient {
  constructor() {
    super();
    // Use a custom adapter so we don't actually make network requests
    this.client.defaults.adapter = async (
      config: InternalAxiosRequestConfig,
    ): Promise<AxiosResponse<MockResponseData>> => {
      // The headers object might be an instance of AxiosHeaders,
      // let's convert it to a plain object to easily test it.
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
      } as AxiosResponse<MockResponseData>; // Force type casting to fix Axios matching type error
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
