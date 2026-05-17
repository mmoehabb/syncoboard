import { prisma } from "@syncoboard/db";

/**
 * Revokes excess perks (workspaces, boards) when a user's subscription changes
 * (e.g. Trial expires, user downgrades to Free).
 * It will prioritize keeping the newest ones active (by createdAt DESC).
 */
export async function enforceSubscriptionLimits(
  userId: string,
  activeSubscription?: any | null,
) {
  let subscription = activeSubscription;

  // If undefined, we fetch it. If null, we know they have no active sub.
  if (subscription === undefined) {
    subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: { gt: new Date() },
      },
      include: {
        price: {
          include: { plan: true },
        },
      },
    });
  }

  // If no active sub, assume Free plan limits. Let's find the Free plan or use safe defaults.
  let maxWorkspaces = 1;
  let maxActiveBoards = 1;

  if (subscription?.price?.plan) {
    maxWorkspaces = subscription.price.plan.maxWorkspaces;
    maxActiveBoards = subscription.price.plan.maxActiveBoards;
  } else {
    const freePlan = await prisma.plan.findFirst({
      where: { name: "Free" },
    });
    if (freePlan) {
      maxWorkspaces = freePlan.maxWorkspaces;
      maxActiveBoards = freePlan.maxActiveBoards;
    }
  }

  // Handle Workspaces limit
  const userAdminWorkspaces = await prisma.workspace.findMany({
    where: {
      isDeleted: false,
      isActive: true,
      members: {
        some: { userId, role: "ADMIN" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (maxWorkspaces !== -1 && userAdminWorkspaces.length > maxWorkspaces) {
    const workspacesToDeactivate = userAdminWorkspaces.slice(maxWorkspaces);
    if (workspacesToDeactivate.length > 0) {
      const workspaceIds = workspacesToDeactivate.map((ws) => ws.id);
      await Promise.all([
        prisma.workspace.updateMany({
          where: { id: { in: workspaceIds } },
          data: { isActive: false },
        }),
        prisma.board.updateMany({
          where: {
            workspaceId: { in: workspaceIds },
          },
          data: { isActive: false },
        }),
      ]);
    }
  }

  // Handle Boards limit across active workspaces
  const userAdminBoards = await prisma.board.findMany({
    where: {
      isDeleted: false,
      isActive: true,
      workspace: {
        isDeleted: false,
        isActive: true,
        members: {
          some: { userId, role: "ADMIN" },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (maxActiveBoards !== -1 && userAdminBoards.length > maxActiveBoards) {
    const boardsToDeactivate = userAdminBoards.slice(maxActiveBoards);
    if (boardsToDeactivate.length > 0) {
      await prisma.board.updateMany({
        where: { id: { in: boardsToDeactivate.map((b) => b.id) } },
        data: { isActive: false },
      });
    }
  }
}
