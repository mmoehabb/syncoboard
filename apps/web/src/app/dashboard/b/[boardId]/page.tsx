import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "../../components/DashboardClient";
import {
  getUserWorkspacesAndBoards,
  subscribeToFreePlan,
  subscribeToTrialPlan,
} from "../../actions";
import { SessionProvider } from "next-auth/react";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ boardId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const boardId = resolvedParams.boardId;
  const searchQuery = resolvedSearchParams?.search
    ? String(resolvedSearchParams.search)
    : undefined;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!boardId) {
    redirect("/dashboard");
  }

  // Verify access to the board
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: {
      tasks: {
        where: searchQuery
          ? {
              title: {
                contains: searchQuery,
                mode: "insensitive",
              },
            }
          : undefined,
        orderBy: { updatedAt: "desc" },
        include: { assignees: true, reviewers: true },
      },
    },
  });

  if (!board) {
    redirect("/dashboard");
  }

  const boardMember = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId: boardId,
        userId: session.user.id,
      },
    },
  });

  if (!boardMember) {
    const workspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: board.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (!workspaceMember) {
      redirect("/dashboard");
    }
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

  // We only load workspaces for the sidebar, no complex redirect logic needed here
  // though realistically users shouldn't reach here without a subscription.
  const workspaces = hasActiveSubscription
    ? await getUserWorkspacesAndBoards(session.user.id)
    : [];

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
            href="/dashboard"
            className="text-syntax-grey hover:text-white font-mono text-sm underline underline-offset-4 decoration-white/20 hover:decoration-white transition-colors"
          >
            Return to dashboard &rarr;
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
        board={board}
      />
    </SessionProvider>
  );
}
