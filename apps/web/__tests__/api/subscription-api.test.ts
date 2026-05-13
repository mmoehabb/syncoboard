import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { mockAxiosInstance } from "../mocks/axios";
import type { AxiosInstance } from "axios";

describe("SubscriptionApi", () => {
  let subscriptionApi: import("@syncoboard/api").SubscriptionApi;

  beforeEach(async () => {
    mockAxiosInstance.post.mockReset();

    const { SubscriptionApi: SubscriptionApiClass } =
      await import("@syncoboard/api");
    subscriptionApi = new SubscriptionApiClass();
    // @ts-expect-error mocking axios
    subscriptionApi["client"] = mockAxiosInstance;
  });

  afterEach(() => {
    mock.restore();
  });

  describe("subscribeToFreePlan", () => {
    it("should subscribe to free plan successfully", async () => {
      const mockSubscription = {
        id: "1",
        userId: "user-1",
        planId: "free-plan",
        status: "ACTIVE",
      };

      mockAxiosInstance.post.mockResolvedValueOnce({
        data: { subscription: mockSubscription },
      });

      const result = await subscriptionApi.subscribeToFreePlan();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith("", {}, undefined);
      expect(result).toEqual(mockSubscription);
    });

    it("should handle error when subscription fails", async () => {
      const mockError = new Error("Already subscribed");
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      await expect(subscriptionApi.subscribeToFreePlan()).rejects.toThrow(
        "Already subscribed",
      );
    });
  });
});
