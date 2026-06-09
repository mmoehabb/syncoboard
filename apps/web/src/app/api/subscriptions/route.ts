import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { enforceSubscriptionLimits } from "@syncoboard/utils";

export async function POST() {
  const userId = await getSessionOrPat();

  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  try {
    const existingSubscription = await prisma.user.findFirst({
      where: { id: userId },
      include: { subscriptions: { where: { status: "ACTIVE" } } },
    });

    if (existingSubscription?.subscriptions?.length) {
      return apiError(
        API_ERRORS.customBadRequest("User already has an active subscription"),
      );
    }

    const freePlan = await prisma.plan.findFirst({
      where: { name: "Free" },
      include: { prices: true },
    });

    if (!freePlan) {
      return apiError(API_ERRORS.customInternal("Free plan not found"));
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId: userId,
        priceId: freePlan.prices[0]?.id || "",
        status: "ACTIVE",
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(
          new Date().setFullYear(new Date().getFullYear() + 100),
        ),
        cancelAtPeriodEnd: false,
      },
      include: {
        price: {
          include: { plan: true },
        },
      },
    });

    await enforceSubscriptionLimits(userId, subscription as any);

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    console.error("Error subscribing to free plan:", error);
    return apiError(
      API_ERRORS.customInternal("Failed to subscribe to free plan"),
    );
  }
}
