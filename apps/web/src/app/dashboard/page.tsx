import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { redirect } from "next/navigation";
import {
  subscribeToFreePlan,
  getUserWorkspacesAndBoards,
  subscribeToTrialPlan,
} from "./actions";
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

  // Create the unclosable modal component to pass to the client
  const SubscriptionModal = (
    <div className="absolute inset-0 bg-obsidian-night/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full surface-panel p-8 bg-void-grey border border-neon-pulse/50 shadow-2xl rounded-md flex flex-col gap-8 max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-2 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Subscription Required
          </h2>
          <p className="text-syntax-grey text-sm font-mono leading-relaxed">
            You do not have an active subscription. Please select a plan to
            continue using Syncoboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allPlans.map((plan) => {
            const price = plan.prices[0];
            const isFree = plan.name === "Free";
            const isTrial = plan.isTrial;
            const requiresPayment = !isFree && !isTrial;

            return (
              <div
                key={plan.id}
                className={`flex flex-col border rounded-md p-6 relative group transition-all ${isFree || isTrial ? "border-white/10 bg-obsidian-night/50 hover:border-git-green/50" : "border-white/10 bg-obsidian-night/50 opacity-60"}`}
              >
                {requiresPayment && (
                  <div className="absolute top-4 right-4 bg-white/10 text-syntax-grey text-xs px-2 py-0.5 rounded font-mono">
                    soon
                  </div>
                )}
                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                  {plan.name}{" "}
                  {plan.name === "Premium" && (
                    <span className="text-neon-pulse">★</span>
                  )}
                </h3>
                <div className="text-2xl font-mono mb-6 text-white">
                  {isFree || isTrial ? (
                    <span
                      className={isTrial ? "text-neon-pulse" : "text-git-green"}
                    >
                      Free
                    </span>
                  ) : (
                    <>
                      ${price ? (price.amount / 100).toFixed(0) : "0"}
                      <span className="text-sm text-syntax-grey">
                        /{price?.interval.toLowerCase()}
                      </span>
                    </>
                  )}
                </div>
                <ul className="text-sm font-mono text-syntax-grey flex flex-col gap-3 flex-1 mb-8">
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        isTrial || plan.name === "Premium"
                          ? "text-neon-pulse"
                          : isFree
                            ? "text-git-green"
                            : "text-syntax-grey"
                      }
                    >
                      ✓
                    </span>{" "}
                    {plan.maxWorkspaces === -1
                      ? "Unlimited"
                      : plan.maxWorkspaces}{" "}
                    Workspaces
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        isTrial || plan.name === "Premium"
                          ? "text-neon-pulse"
                          : isFree
                            ? "text-git-green"
                            : "text-syntax-grey"
                      }
                    >
                      ✓
                    </span>{" "}
                    {plan.maxBoardsPerWorkspace === -1
                      ? "Unlimited"
                      : plan.maxBoardsPerWorkspace}{" "}
                    Boards/Workspace
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        isTrial || plan.name === "Premium"
                          ? "text-neon-pulse"
                          : isFree
                            ? "text-git-green"
                            : "text-syntax-grey"
                      }
                    >
                      ✓
                    </span>{" "}
                    {plan.maxMembersPerBoard === -1
                      ? "Unlimited"
                      : plan.maxMembersPerBoard}{" "}
                    Members/Board
                  </li>
                  <li className="flex items-center gap-2">
                    <span
                      className={
                        isTrial || plan.name === "Premium"
                          ? "text-neon-pulse"
                          : isFree
                            ? "text-git-green"
                            : "text-syntax-grey"
                      }
                    >
                      ✓
                    </span>{" "}
                    {plan.maxActiveBoards === -1
                      ? "Unlimited"
                      : plan.maxActiveBoards}{" "}
                    Active Boards Total
                  </li>
                </ul>

                {isFree && (
                  <form action={subscribeToFreePlan} className="mt-auto">
                    <button className="w-full bg-void-grey border border-git-green/30 hover:border-git-green hover:bg-git-green/10 transition-all rounded py-2.5 text-white font-mono text-sm cursor-pointer">
                      Get Started
                    </button>
                  </form>
                )}

                {isTrial && (
                  <form
                    action={subscribeToTrialPlan.bind(null, plan.id)}
                    className="mt-auto"
                  >
                    <button className="w-full bg-void-grey border border-neon-pulse/30 hover:border-neon-pulse hover:bg-neon-pulse/10 transition-all rounded py-2.5 text-white font-mono text-sm cursor-pointer">
                      Start Trial
                    </button>
                  </form>
                )}

                {requiresPayment && (
                  <button
                    onClick={() => {
                      window.location.href = "/#pricing";
                    }}
                    className="w-full bg-void-grey border border-white/10 hover:border-white/20 rounded py-2.5 text-white hover:text-neon-pulse font-mono text-sm mt-auto transition-colors"
                  >
                    Subscribe
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-4">
          <a
            href="/plans"
            className="text-syntax-grey hover:text-white font-mono text-sm underline underline-offset-4 decoration-white/20 hover:decoration-white transition-colors"
          >
            View more detailed plan information &rarr;
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <SessionProvider>
      <DashboardClient
        workspaces={workspaces}
        hasActiveSubscription={!!hasActiveSubscription}
        modalComponent={SubscriptionModal}
      />
    </SessionProvider>
  );
}
