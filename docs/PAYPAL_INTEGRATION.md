# PayPal Integration Guide

This guide describes how to configure and integrate PayPal for subscription payments in the Syncoboard application.

## Prerequisites

1.  **PayPal Developer Account:** You need a Business or Developer account at [PayPal Developer](https://developer.paypal.com).
2.  **App & Credentials:** Create a REST API app in the PayPal Developer Dashboard to obtain your `Client ID` and `Client Secret`.

## Environment Variables

Copy the `.env.example` file to `.env` (if you haven't already) and populate the following PayPal variables:

```env
PAYPAL_ENV=sandbox # Use 'production' for live environment
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
```

## Webhooks Setup

To receive updates about subscription statuses (e.g., activations, cancellations, expirations, payment failures), you must configure a webhook in the PayPal Developer Dashboard.

1.  Navigate to your App in the PayPal Developer Dashboard.
2.  Scroll down to the **Webhooks** section and click **Add Webhook**.
3.  Set the **Webhook URL** to your application's public URL followed by the webhook endpoint.
    - Example: `https://your-domain.com/api/subscriptions/webhook/paypal`
    - _Note: For local development, use a tool like Ngrok to expose your local server to the internet._
4.  Select the following events:
    - `Billing subscription activated`
    - `Billing subscription cancelled`
    - `Billing subscription expired`
    - `Payment failure on subscription`
5.  Save the webhook and copy the generated **Webhook ID**.
6.  Add the Webhook ID to your `.env` file:

```env
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
```

## Architecture

The integration leverages the abstract `PaymentProvider` interface defined in `@syncoboard/payment`.

- **Plans & Prices:** The `syncPlans` method automatically maps local `Plan` and `Price` models to PayPal Products and Billing Plans, saving the `providerPlanId` to the database.
- **Checkout:** When a user subscribes, the application calls `/api/subscriptions/checkout`, generates a PayPal checkout session using `createSubscription`, and redirects the user to the approval URL.
- **Webhooks:** The `/api/subscriptions/webhook/paypal` endpoint receives PayPal events, verifies the cryptographic signature, and updates the local subscription status (`ACTIVE`, `CANCELED`, `EXPIRED`, `PAST_DUE`) accordingly.

## Troubleshooting

- **Invalid Signature:** If webhook signature verification fails, ensure your `PAYPAL_WEBHOOK_ID` strictly matches the ID from the PayPal dashboard.
- **Plan Sync Issues:** If plans fail to sync, ensure your prices have amounts greater than 0 and valid intervals (`WEEK`, `MONTH`, `YEAR`).
