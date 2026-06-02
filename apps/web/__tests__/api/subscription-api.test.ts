import { describe, expect, it, beforeEach, afterEach, mock } from "bun:test";
import { mockAxiosInstance } from "../mocks/axios";
import type { AxiosInstance } from "axios";
import { SubscriptionApi } from "../../../../packages/api/src/SubscriptionApi";

describe("SubscriptionApi", () => {
  let subscriptionApi: import("@syncoboard/api").SubscriptionApi;

  beforeEach(() => {
    mockAxiosInstance.post.mockReset();
    subscriptionApi = new SubscriptionApi();
    subscriptionApi["client"] = mockAxiosInstance as unknown as AxiosInstance;
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
