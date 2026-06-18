import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { apiError, API_ERRORS } from "@/lib/api/error";
import { prisma } from "@syncoboard/db";
import { PayPalProvider } from "@syncoboard/payment";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return apiError(API_ERRORS.UNAUTHORIZED);
    }

    const { priceId } = await req.json();

    if (!priceId) {
      return apiError(API_ERRORS.customBadRequest("priceId is required"));
    }

    const price = await prisma.price.findUnique({
      where: { id: priceId },
      include: { plan: true },
    });

    if (!price) {
      return apiError(API_ERRORS.customNotFound("Price"));
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
      return apiError(
        API_ERRORS.customInternal("Could not sync provider plan"),
      );
    }

    const user = {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name || "User",
    };

    let providerSubscriptionId: string;
    let approvalUrl: string;

    try {
      const result = await provider.createSubscription(user, price);
      providerSubscriptionId = result.providerSubscriptionId;
      approvalUrl = result.approvalUrl;
    } catch (err: any) {
      // If the plan doesn't exist on the provider side (e.g. moved from sandbox to production),
      // we clear the local providerPlanId and attempt to re-sync.
      if (err?.response?.status === 404 || err?.response?.status === 400) {
        console.warn(
          `Provider plan not found for price ${price.id}. Attempting to re-sync...`,
        );

        await prisma.price.update({
          where: { id: price.id },
          data: { providerPlanId: null },
        });
        price.providerPlanId = null;

        const planToSync = await prisma.plan.findUnique({
          where: { id: price.planId },
          include: { prices: true },
        });

        if (planToSync) {
          // Temporarily set providerPlanId to null so syncPlans will process it
          planToSync.prices = planToSync.prices.map((p) =>
            p.id === price.id ? { ...p, providerPlanId: null } : p,
          );

          await provider.syncPlans([planToSync]);

          const updatedPrice = await prisma.price.findUnique({
            where: { id: price.id },
          });

          if (updatedPrice && updatedPrice.providerPlanId) {
            price.providerPlanId = updatedPrice.providerPlanId;
            const retryResult = await provider.createSubscription(user, price);
            providerSubscriptionId = retryResult.providerSubscriptionId;
            approvalUrl = retryResult.approvalUrl;
          } else {
            throw new Error("Failed to re-sync provider plan");
          }
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }

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
  } catch (error: unknown) {
    console.error(
      "Checkout Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return apiError(API_ERRORS.INTERNAL_SERVER_ERROR);
  }
}
