import axios from "axios";

const getBaseUrl = () => {
  return process.env.PAYPAL_ENV === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
};

let accessToken: string | null = null;
let tokenExpiresAt = 0;

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal credentials");
  }

  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await axios.post(
    `${getBaseUrl()}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  accessToken = response.data.access_token;
  // Expire 5 minutes before actual expiration
  tokenExpiresAt = Date.now() + (response.data.expires_in - 300) * 1000;

  return String(accessToken);
}

export async function createPayPalProduct(id: string, name: string) {
  const token = await getPayPalAccessToken();
  const response = await axios.post(
    `${getBaseUrl()}/v1/catalogs/products`,
    {
      id: id,
      name: name,
      type: "SERVICE",
      category: "SOFTWARE",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  return response.data;
}

export async function createPayPalPlan(
  productId: string,
  name: string,
  interval: "WEEK" | "MONTH" | "YEAR" | "LIFETIME",
  amount: number,
  currency: string,
) {
  const token = await getPayPalAccessToken();

  let intervalUnit = "MONTH";
  let intervalCount = 1;

  if (interval === "WEEK") {
    intervalUnit = "WEEK";
  } else if (interval === "YEAR") {
    intervalUnit = "YEAR";
  } else if (interval === "LIFETIME") {
    // PayPal Subscriptions don't really support 'Lifetime'
    intervalUnit = "YEAR";
    intervalCount = 100;
  }

  const response = await axios.post(
    `${getBaseUrl()}/v1/billing/plans`,
    {
      product_id: productId,
      name: name,
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: {
            interval_unit: intervalUnit,
            interval_count: intervalCount,
          },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // Infinite
          pricing_scheme: {
            fixed_price: {
              value: (amount / 100).toFixed(2),
              currency_code: currency.toUpperCase(),
            },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: "0.00",
          currency_code: currency.toUpperCase(),
        },
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 3,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

export async function createPayPalSubscription(
  planId: string,
  subscriber: { email: string; name: string },
  returnUrl: string,
  cancelUrl: string,
) {
  const token = await getPayPalAccessToken();

  const response = await axios.post(
    `${getBaseUrl()}/v1/billing/subscriptions`,
    {
      plan_id: planId,
      subscriber: {
        name: {
          given_name: subscriber.name,
        },
        email_address: subscriber.email,
      },
      application_context: {
        brand_name: "Syncoboard",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

export async function cancelPayPalSubscription(subscriptionId: string) {
  const token = await getPayPalAccessToken();

  await axios.post(
    `${getBaseUrl()}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      reason: "User requested cancellation",
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
}

export async function verifyWebhookSignature(
  transmissionId: string,
  transmissionTime: string,
  certUrl: string,
  authAlgo: string,
  transmissionSig: string,
  webhookId: string,
  webhookEvent: unknown,
) {
  const token = await getPayPalAccessToken();

  const response = await axios.post(
    `${getBaseUrl()}/v1/notifications/verify-webhook-signature`,
    {
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  return response.data.verification_status === "SUCCESS";
}
