import { ApiClient } from "./ApiClient";
import { AxiosRequestConfig } from "axios";
import type { Subscription } from "@syncoboard/db";

export class SubscriptionApi extends ApiClient {
  constructor(baseURL?: string) {
    super(baseURL ? `${baseURL}/api/subscriptions` : "/api/subscriptions");
  }

  public async subscribeToFreePlan(
    config?: AxiosRequestConfig,
  ): Promise<Subscription> {
    const response = await this.post<{ subscription: Subscription }>(
      "",
      {},
      config,
    );
    return response.data.subscription;
  }

  public async checkout(
    priceId: string,
    config?: AxiosRequestConfig,
  ): Promise<{ approvalUrl: string }> {
    const response = await this.post<{ approvalUrl: string }>(
      "/checkout",
      { priceId },
      config,
    );
    return response.data;
  }
}

export const subscriptionApi = new SubscriptionApi();
