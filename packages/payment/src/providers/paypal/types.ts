export interface PayPalWebhookEvent {
  event_type:
    | "BILLING.SUBSCRIPTION.ACTIVATED"
    | "BILLING.SUBSCRIPTION.CANCELLED"
    | "BILLING.SUBSCRIPTION.EXPIRED"
    | "BILLING.SUBSCRIPTION.PAYMENT.FAILED"
    | (string & {});
  resource: {
    id: string;
    start_time?: string;
    billing_info?: {
      next_billing_time?: string;
    };
  };
}
