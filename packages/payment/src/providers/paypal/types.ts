export interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    start_time?: string;
    billing_info?: {
      next_billing_time?: string;
    };
  };
}
