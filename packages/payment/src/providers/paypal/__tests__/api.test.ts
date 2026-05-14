import { expect, test, describe, beforeEach, afterEach, mock } from "bun:test";
import axios from "axios";
import {
  getPayPalAccessToken,
  createPayPalProduct,
  createPayPalPlan,
  createPayPalSubscription,
  cancelPayPalSubscription,
  verifyWebhookSignature,
} from "../api";

mock.module("axios", () => ({
  default: {
    post: mock(),
  },
}));

describe("PayPal API", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.PAYPAL_CLIENT_ID = "test-client-id";
    process.env.PAYPAL_CLIENT_SECRET = "test-client-secret";
    process.env.PAYPAL_ENV = "sandbox";
    (axios.post as any).mockClear();

    // Default mock implementation to handle token requests and other API calls
    (axios.post as any).mockImplementation((url: string) => {
      if (url.includes("/v1/oauth2/token")) {
        return Promise.resolve({
          data: {
            access_token: "mock-token",
            expires_in: 3600,
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("getPayPalAccessToken", () => {
    test("should throw error if credentials are missing", async () => {
      delete process.env.PAYPAL_CLIENT_ID;
      await expect(getPayPalAccessToken()).rejects.toThrow(
        "Missing PayPal credentials",
      );
    });

    test("should fetch access token successfully", async () => {
      const token = await getPayPalAccessToken();

      expect(token).toBeDefined();
      expect(axios.post).toHaveBeenCalledWith(
        "https://api-m.sandbox.paypal.com/v1/oauth2/token",
        "grant_type=client_credentials",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Basic "),
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        }),
      );
    });

    test("should use cached token if not expired", async () => {
      // Clear mock to track new calls
      (axios.post as any).mockClear();

      // Since the module is not reloaded, the token from previous tests might still be there.
      // We call it once to ensure it's cached.
      await getPayPalAccessToken();
      const initialCallCount = (axios.post as any).mock.calls.filter(
        (call: any[]) => call[0].includes("/v1/oauth2/token"),
      ).length;

      // Second call should use cache
      await getPayPalAccessToken();
      const secondCallCount = (axios.post as any).mock.calls.filter(
        (call: any[]) => call[0].includes("/v1/oauth2/token"),
      ).length;

      expect(secondCallCount).toBe(initialCallCount);
    });
  });

  describe("createPayPalProduct", () => {
    test("should create product successfully", async () => {
      (axios.post as any).mockImplementation((url: string) => {
        if (url.includes("/v1/oauth2/token")) {
          return Promise.resolve({
            data: { access_token: "token", expires_in: 3600 },
          });
        }
        if (url.includes("/v1/catalogs/products")) {
          return Promise.resolve({
            data: { id: "PROD-123", name: "Test Product" },
          });
        }
        return Promise.resolve({ data: {} });
      });

      const result = await createPayPalProduct("PROD-123", "Test Product");

      expect(result.id).toBe("PROD-123");
      expect(axios.post).toHaveBeenCalledWith(
        "https://api-m.sandbox.paypal.com/v1/catalogs/products",
        {
          id: "PROD-123",
          name: "Test Product",
          type: "SERVICE",
          category: "SOFTWARE",
        },
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer "),
          }),
        }),
      );
    });
  });

  describe("createPayPalPlan", () => {
    test("should create plan with correct interval mapping", async () => {
      (axios.post as any).mockImplementation((url: string) => {
        if (url.includes("/v1/oauth2/token")) {
          return Promise.resolve({
            data: { access_token: "token", expires_in: 3600 },
          });
        }
        if (url.includes("/v1/billing/plans")) {
          return Promise.resolve({ data: { id: "PLAN-123" } });
        }
        return Promise.resolve({ data: {} });
      });

      await createPayPalPlan("PROD-123", "Monthly Plan", "MONTH", 1000, "USD");

      expect(axios.post).toHaveBeenCalledWith(
        "https://api-m.sandbox.paypal.com/v1/billing/plans",
        expect.objectContaining({
          product_id: "PROD-123",
          billing_cycles: [
            expect.objectContaining({
              frequency: {
                interval_unit: "MONTH",
                interval_count: 1,
              },
              pricing_scheme: {
                fixed_price: {
                  value: "10.00",
                  currency_code: "USD",
                },
              },
            }),
          ],
        }),
        expect.any(Object),
      );
    });

    test("should handle LIFETIME interval as 100 years", async () => {
      await createPayPalPlan(
        "PROD-123",
        "Lifetime Plan",
        "LIFETIME",
        5000,
        "USD",
      );

      expect(axios.post).toHaveBeenCalledWith(
        "https://api-m.sandbox.paypal.com/v1/billing/plans",
        expect.objectContaining({
          billing_cycles: [
            expect.objectContaining({
              frequency: {
                interval_unit: "YEAR",
                interval_count: 100,
              },
            }),
          ],
        }),
        expect.any(Object),
      );
    });
  });

  describe("createPayPalSubscription", () => {
    test("should create subscription successfully", async () => {
      (axios.post as any).mockImplementation((url: string) => {
        if (url.includes("/v1/oauth2/token")) {
          return Promise.resolve({
            data: { access_token: "token", expires_in: 3600 },
          });
        }
        if (url.includes("/v1/billing/subscriptions")) {
          return Promise.resolve({
            data: { id: "I-123", status: "APPROVAL_PENDING" },
          });
        }
        return Promise.resolve({ data: {} });
      });

      const subscriber = { email: "user@example.com", name: "John Doe" };
      await createPayPalSubscription(
        "PLAN-123",
        subscriber,
        "https://return.com",
        "https://cancel.com",
      );

      expect(axios.post).toHaveBeenCalledWith(
        "https://api-m.sandbox.paypal.com/v1/billing/subscriptions",
        expect.objectContaining({
          plan_id: "PLAN-123",
          subscriber: {
            name: { given_name: "John Doe" },
            email_address: "user@example.com",
          },
          application_context: expect.objectContaining({
            return_url: "https://return.com",
            cancel_url: "https://cancel.com",
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe("cancelPayPalSubscription", () => {
    test("should cancel subscription successfully", async () => {
      await cancelPayPalSubscription("I-123");

      expect(axios.post).toHaveBeenCalledWith(
        "https://api-m.sandbox.paypal.com/v1/billing/subscriptions/I-123/cancel",
        { reason: "User requested cancellation" },
        expect.any(Object),
      );
    });
  });

  describe("verifyWebhookSignature", () => {
    test("should return true on SUCCESS", async () => {
      (axios.post as any).mockImplementation((url: string) => {
        if (url.includes("/v1/oauth2/token")) {
          return Promise.resolve({
            data: { access_token: "token", expires_in: 3600 },
          });
        }
        if (url.includes("/v1/notifications/verify-webhook-signature")) {
          return Promise.resolve({ data: { verification_status: "SUCCESS" } });
        }
        return Promise.resolve({ data: {} });
      });

      const isValid = await verifyWebhookSignature(
        "trans-id",
        "time",
        "cert-url",
        "algo",
        "sig",
        "webhook-id",
        { event: "test" },
      );

      expect(isValid).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        "https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature",
        expect.objectContaining({
          transmission_id: "trans-id",
          webhook_id: "webhook-id",
        }),
        expect.any(Object),
      );
    });

    test("should return false on FAILURE", async () => {
      (axios.post as any).mockImplementation((url: string) => {
        if (url.includes("/v1/oauth2/token")) {
          return Promise.resolve({
            data: { access_token: "token", expires_in: 3600 },
          });
        }
        if (url.includes("/v1/notifications/verify-webhook-signature")) {
          return Promise.resolve({ data: { verification_status: "FAILURE" } });
        }
        return Promise.resolve({ data: {} });
      });

      const isValid = await verifyWebhookSignature(
        "trans-id",
        "time",
        "cert-url",
        "algo",
        "sig",
        "webhook-id",
        { event: "test" },
      );

      expect(isValid).toBe(false);
    });
  });
});
