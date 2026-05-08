import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { PayPalProvider } from "@syncoboard/payment";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId is required" },
        { status: 400 },
      );
    }

    const price = await prisma.price.findUnique({
      where: { id: priceId },
      include: { plan: true },
    });

    if (!price) {
      return NextResponse.json({ error: "Price not found" }, { status: 404 });
    }

    const provider = new PayPalProvider();

    // Make sure plans are synced if they don't have a providerPlanId yet
    if (!price.providerPlanId) {
      const planToSync = await prisma.plan.findUnique({
        where: { id: price.planId },
        include: { prices: true },
      });
      if (planToSync) {
        await provider.syncPlans([planToSync]);
        // Refresh the price after sync
        const updatedPrice = await prisma.price.findUnique({
          where: { id: priceId },
        });
        if (updatedPrice) {
          price.providerPlanId = updatedPrice.providerPlanId;
        }
      }
    }

    if (!price.providerPlanId) {
      return NextResponse.json(
        { error: "Could not sync provider plan" },
        { status: 500 },
      );
    }

    const user = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name || "User",
    };

    const { providerSubscriptionId, approvalUrl } =
      await provider.createSubscription(user, price);

    // Create an initial INACTIVE subscription in our DB
    const now = new Date();
    // Default 1 month
    const currentPeriodEnd = new Date(now);
    if (price.interval === "YEAR") {
      currentPeriodEnd.setFullYear(now.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(now.getMonth() + 1);
    }

    await prisma.subscription.create({
      data: {
        userId: session.user.id,
        priceId: price.id,
        provider: "PAYPAL",
        providerSubscriptionId: providerSubscriptionId,
        status: "PAST_DUE", // Wait for webhook to activate it
        currentPeriodStart: now,
        currentPeriodEnd: currentPeriodEnd,
      },
    });

    return NextResponse.json({ approvalUrl });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
