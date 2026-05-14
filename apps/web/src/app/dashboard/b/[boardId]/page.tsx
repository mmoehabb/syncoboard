import { auth } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { redirect } from "next/navigation";
import { SubscriptionModal } from "../../components/SubscriptionModal";
import { DashboardClient } from "../../components/DashboardClient";
import { getUserWorkspacesAndBoards } from "../../actions";
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

  return (
    <SessionProvider>
      <DashboardClient
        workspaces={workspaces}
        hasActiveSubscription={!!hasActiveSubscription}
        modalComponent={
          <SubscriptionModal
            allPlans={allPlans}
            bottomLink="/dashboard"
            bottomText="Return to dashboard &rarr;"
          />
        }
        board={board}
      />
    </SessionProvider>
  );
}
