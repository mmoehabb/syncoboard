import { describe, it, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { UserApi } from "../UserApi";

describe("UserApi", () => {
  let userApi: UserApi;
  let postSpy: ReturnType<typeof spyOn>;

  beforeEach(() => {
    userApi = new UserApi();

    // The environment might mock axios globally (e.g. apps/web/__tests__/mocks/axios.ts)
    // which replaces userApi.client with a mock that doesn't have defaults.adapter.
    // Instead of overriding the adapter, we spy on the protected method directly.
    postSpy = spyOn(
      userApi as unknown as {
        post: (url: string, data?: unknown) => Promise<unknown>;
      },
      "post",
    );
  });

  afterEach(() => {
    postSpy.mockRestore();
  });

  describe("updateLastOnline", () => {
    it("should call post with the correct URL", async () => {
      postSpy.mockResolvedValue({});

      await userApi.updateLastOnline();

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("/activity");
    });

    it("should handle error if API call fails", async () => {
      const mockError = new Error("API Error");
      postSpy.mockRejectedValue(mockError);

      await expect(userApi.updateLastOnline()).rejects.toBe(mockError);

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(postSpy).toHaveBeenCalledWith("/activity");
    });
  });
});
