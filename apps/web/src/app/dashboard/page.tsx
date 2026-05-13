import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { redirect } from "next/navigation";
import { getUserWorkspacesAndBoards } from "./actions";
import { SubscriptionModal } from "./components/SubscriptionModal";
import { DashboardClient } from "./components/DashboardClient";
import { SessionProvider } from "next-auth/react";
import type { DashboardWorkspace } from "./components/types";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userWithSubscriptions = await prisma.user.findFirst({
    where: { id: session.user.id },
    include: {
      subscriptions: {
        where: {
          status: "ACTIVE",
          currentPeriodEnd: {
            gt: new Date(),
          },
        },
      },
    },
  });

  const hasActiveSubscription =
    userWithSubscriptions?.subscriptions &&
    userWithSubscriptions.subscriptions.length > 0;

  let workspaces: DashboardWorkspace[] = [];

  // Check if any of the user's workspaces have a GitHub App installation
  // We only redirect if they have an active subscription
  if (hasActiveSubscription) {
    workspaces = await getUserWorkspacesAndBoards(session.user.id);

    // If the user has no workspaces at all yet, wait for the background creation
    // rather than triggering an infinite redirect loop
    if (workspaces.length === 0) {
      return (
        <div className="flex h-screen items-center justify-center text-white font-mono">
          Setting up your workspace...
        </div>
      );
    }

    const hasGithubInstallation = workspaces.some(
      (ws) => !!ws.githubInstallationId,
    );

    if (!hasGithubInstallation) {
      const githubAppName =
        process.env.NEXT_PUBLIC_GITHUB_APP_NAME || "syncoboard";
      redirect(`https://github.com/apps/${githubAppName}/installations/new`);
    }
  } else {
    // If they don't have a subscription, we still want to render the dashboard
    // but without waiting for the workspace creation. It can be an empty list.
    workspaces = [];
  }

  const allPlans = await prisma.plan.findMany({
    where: { isActive: true },
    include: { prices: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <SessionProvider>
      <DashboardClient
        workspaces={workspaces}
        hasActiveSubscription={!!hasActiveSubscription}
        modalComponent={
          <SubscriptionModal
            allPlans={allPlans}
            bottomLink="/plans"
            bottomText="View more detailed plan information &rarr;"
          />
        }
      />
    </SessionProvider>
  );
}
