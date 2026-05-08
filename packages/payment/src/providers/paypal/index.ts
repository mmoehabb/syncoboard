import { Plan, Price } from "@syncoboard/db";
import { PaymentProvider, CreateSubscriptionResult } from "../../types";
import {
  createPayPalPlan,
  createPayPalProduct,
  createPayPalSubscription,
  cancelPayPalSubscription,
  verifyWebhookSignature,
} from "./api";
import { prisma } from "@syncoboard/db";

export class PayPalProvider implements PaymentProvider {
  async syncPlans(plans: (Plan & { prices: Price[] })[]): Promise<void> {
    for (const plan of plans) {
      try {
        await createPayPalProduct(plan.id, plan.name);
      } catch (err: any) {
        if (err.response?.status !== 400) {
          console.error(
            `Error creating PayPal product for plan ${plan.id}`,
            err.response?.data || err.message,
          );
        }
      }

      for (const price of plan.prices) {
        if (!price.providerPlanId && price.amount > 0) {
          try {
            const paypalPlan = await createPayPalPlan(
              plan.id,
              `${plan.name} - ${price.interval}`,
              price.interval as any,
              price.amount,
              price.currency,
            );

            await prisma.price.update({
              where: { id: price.id },
              data: { providerPlanId: paypalPlan.id },
            });
            console.log(
              `Synced PayPal plan for Price ${price.id}: ${paypalPlan.id}`,
            );
          } catch (err: any) {
            console.error(
              `Error creating PayPal plan for price ${price.id}`,
              err.response?.data || err.message,
            );
          }
        }
      }
    }
  }

  async createSubscription(
    user: { id: string; email: string; name: string },
    price: Price,
  ): Promise<CreateSubscriptionResult> {
    if (!price.providerPlanId) {
      throw new Error(
        `Price ${price.id} does not have a PayPal providerPlanId synced`,
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "http://localhost:3000";
    const returnUrl = `${appUrl}/subscriptions/success`;
    const cancelUrl = `${appUrl}/subscriptions/cancel`;

    const sub = await createPayPalSubscription(
      price.providerPlanId,
      user,
      returnUrl,
      cancelUrl,
    );

    const approvalLink = sub.links.find((link: any) => link.rel === "approve");

    if (!approvalLink) {
      throw new Error("Could not find approval link in PayPal response");
    }

    return {
      providerSubscriptionId: sub.id,
      approvalUrl: approvalLink.href,
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    await cancelPayPalSubscription(providerSubscriptionId);
  }

  async handleWebhook(
    rawBody: string,
    headers: Record<string, string>,
  ): Promise<any> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) {
      throw new Error("Missing PAYPAL_WEBHOOK_ID");
    }

    const transmissionId =
      headers["paypal-transmission-id"] || headers["PayPal-Transmission-Id"];
    const transmissionTime =
      headers["paypal-transmission-time"] ||
      headers["PayPal-Transmission-Time"];
    const certUrl = headers["paypal-cert-url"] || headers["PayPal-Cert-Url"];
    const authAlgo = headers["paypal-auth-algo"] || headers["PayPal-Auth-Algo"];
    const transmissionSig =
      headers["paypal-transmission-sig"] || headers["PayPal-Transmission-Sig"];

    if (
      !transmissionId ||
      !transmissionTime ||
      !certUrl ||
      !authAlgo ||
      !transmissionSig
    ) {
      throw new Error("Missing PayPal webhook headers");
    }

    const parsedBody = JSON.parse(rawBody);

    const isValid = await verifyWebhookSignature(
      transmissionId,
      transmissionTime,
      certUrl,
      authAlgo,
      transmissionSig,
      webhookId,
      parsedBody,
    );

    if (!isValid) {
      throw new Error("Invalid PayPal webhook signature");
    }

    return parsedBody;
  }
}
