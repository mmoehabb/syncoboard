import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { ApiClient, setGlobalApiToken } from "../ApiClient";

class MockApiClient extends ApiClient {
  constructor() {
    super();
    // Use a custom adapter so we don't actually make network requests
    this.client.defaults.adapter = async (config) => {
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
      } as any;
    };
  }

  public getTest(url: string) {
    return super.get(url);
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
