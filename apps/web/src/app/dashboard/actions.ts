"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { revalidatePath } from "next/cache";
import { hasValidSubscription } from "@/lib/api/with-subscription";

export async function subscribeToFreePlan() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const hasActive = await hasValidSubscription(session.user.id);

  if (hasActive) {
    return { error: "User already has an active subscription" };
  }

  const freePlan = await prisma.plan.findFirst({
    where: { name: "Free" },
    include: { prices: true },
  });

  if (!freePlan) return { error: "Free plan not found" };

  await prisma.subscription.create({
    data: {
      userId: session.user.id,
      priceId: freePlan.prices[0]?.id || "",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(
        new Date().setFullYear(new Date().getFullYear() + 100),
      ),
      cancelAtPeriodEnd: false,
    },
  });

  revalidatePath("/dashboard");
}

export async function subscribeToTrialPlan(planId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const hasActive = await hasValidSubscription(session.user.id);

  if (hasActive) {
    return { error: "User already has an active subscription" };
  }

  const trialPlan = await prisma.plan.findUnique({
    where: { id: planId },
    include: { prices: true },
  });

  if (!trialPlan || !trialPlan.isTrial) {
    return { error: "Valid trial plan not found" };
  }

  // Check if they ever had a trial plan
  const pastTrials = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      price: {
        plan: {
          isTrial: true,
        },
      },
    },
  });

  if (pastTrials) {
    return {
      error:
        "You have already used your free trial. Please select another plan.",
    };
  }

  const price = trialPlan.prices[0];
  if (!price) {
    return { error: "No price found for trial plan" };
  }

  const currentPeriodStart = new Date();
  const currentPeriodEnd = new Date();

  if (price.interval === "WEEK") {
    currentPeriodEnd.setDate(
      currentPeriodEnd.getDate() + 7 * price.intervalCount,
    );
  } else if (price.interval === "MONTH") {
    currentPeriodEnd.setMonth(
      currentPeriodEnd.getMonth() + 1 * price.intervalCount,
    );
  } else if (price.interval === "YEAR") {
    currentPeriodEnd.setFullYear(
      currentPeriodEnd.getFullYear() + 1 * price.intervalCount,
    );
  }

  await prisma.subscription.create({
    data: {
      userId: session.user.id,
      priceId: price.id,
      status: "ACTIVE",
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  revalidatePath("/dashboard");
}

export async function getUserWorkspacesAndBoards(userId: string) {
  const isValidSubscription = await hasValidSubscription(userId);
  if (!isValidSubscription) {
    throw new Error("Active subscription required");
  }

  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId },
      },
    },
    include: {
      boards: true,
    },
  });
  return workspaces;
}
