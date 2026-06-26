import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { redirect } from "next/navigation";
import { getUserWorkspacesAndBoards } from "../../actions";
import { DashboardClient } from "../../components/DashboardClient";
import { SubscriptionModal } from "../../components/SubscriptionModal";
import { SessionProvider } from "next-auth/react";
import type { DashboardWorkspace } from "../../components/types";
import { BoardGrid } from "../../components/BoardGrid";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { workspaceId } = await params;

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

  if (hasActiveSubscription) {
    workspaces = await getUserWorkspacesAndBoards(session.user.id);
  }

  const activeWorkspace = workspaces.find((ws) => ws.id === workspaceId);

  if (!activeWorkspace) {
    redirect("/dashboard");
  }

  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });

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
      <div className="absolute top-[52px] left-64 right-0 bottom-0 overflow-y-auto bg-obsidian-night z-10">
        <BoardGrid workspace={activeWorkspace} isAdmin={member?.role === "ADMIN"} />
      </div>
    </SessionProvider>
  );
}
