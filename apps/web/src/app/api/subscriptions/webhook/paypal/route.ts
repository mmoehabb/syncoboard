import { NextResponse } from "next/server";
import { prisma } from "@syncoboard/db";
import { PayPalProvider } from "@syncoboard/payment";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());

    const provider = new PayPalProvider();

    let event;
    try {
      event = await provider.handleWebhook(rawBody, headers);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 },
      );
    }

    const { event_type, resource } = event;

    // The subscription ID is typically found in resource.id
    const providerSubscriptionId = resource.id;

    if (!providerSubscriptionId) {
      return NextResponse.json({ received: true });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { providerSubscriptionId },
    });

    if (!subscription) {
      return NextResponse.json({ received: true });
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

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
