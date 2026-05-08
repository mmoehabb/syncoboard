import { Plan, Price, Subscription } from "@syncoboard/db";

export interface CreateSubscriptionResult {
  providerSubscriptionId: string;
  approvalUrl: string;
}

export interface PaymentProvider {
  /**
   * Sync local plans with the provider.
   * Creates or updates plans/products in the provider's system.
   */
  syncPlans(plans: (Plan & { prices: Price[] })[]): Promise<void>;

  /**
   * Create a new subscription for a user.
   * Returns the provider's subscription ID and an approval URL for the frontend to redirect to.
   */
  createSubscription(
    user: { id: string; email: string; name: string },
    price: Price,
  ): Promise<CreateSubscriptionResult>;

  /**
   * Cancel an existing subscription.
   */
  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  /**
   * Handle incoming webhooks from the provider.
   */
  handleWebhook(rawBody: string, headers: Record<string, string>): Promise<any>;
}
