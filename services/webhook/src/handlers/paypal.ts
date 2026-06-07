import { prisma } from "@syncoboard/db";
import { PayPalProvider } from "@syncoboard/payment";

export async function handlePaypalWebhook(req: Request): Promise<Response> {
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const provider = new PayPalProvider();

    let event;
    try {
      event = await provider.handleWebhook(rawBody, headers);
    } catch (err: unknown) {
      console.error(
        "Webhook signature verification failed:",
        err instanceof Error ? err.message : err,
      );
      return new Response(
        JSON.stringify({ error: "Webhook signature verification failed" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { event_type, resource } = event;

    // The subscription ID is typically found in resource.id
    const providerSubscriptionId = resource.id;

    if (!providerSubscriptionId) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { providerSubscriptionId },
    });

    if (!subscription) {
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: new Date(resource.start_time || new Date()),
          currentPeriodEnd: new Date(
            resource.billing_info?.next_billing_time || new Date(),
          ),
        },
      });
    } else if (event_type === "BILLING.SUBSCRIPTION.CANCELLED") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "CANCELED",
          cancelAtPeriodEnd: true,
        },
      });
    } else if (event_type === "BILLING.SUBSCRIPTION.EXPIRED") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "EXPIRED",
        },
      });
    } else if (event_type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: "PAST_DUE",
        },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
