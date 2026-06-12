import { prisma } from "@syncoboard/db";
import type { Plan, Subscription } from "@syncoboard/db";

/**
 * Revokes excess perks (workspaces, boards) when a user's subscription changes
 * (e.g. Trial expires, user downgrades to Free).
 * It will prioritize keeping the newest ones active (by createdAt DESC).
 */
export async function enforceSubscriptionLimits(
  userId: string,
  subscription?: (Subscription & { price?: { plan: Plan } }) | null,
) {
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

/**
 * Bulk enforces subscription limits for a list of users, assuming they all have NO active subscription
 * (i.e. they are all falling back to the Free plan). This is optimized for the daily cron job.
 */
export async function enforceBulkSubscriptionLimits(userIds: string[]) {
  if (userIds.length === 0) return;

  let maxWorkspaces = 1;
  let maxActiveBoards = 1;

  const freePlan = await prisma.plan.findFirst({
    where: { name: "Free" },
  });
  if (freePlan) {
    maxWorkspaces = freePlan.maxWorkspaces;
    maxActiveBoards = freePlan.maxActiveBoards;
  }

  // Handle Workspaces limit in bulk
  const allUserAdminWorkspaces = await prisma.workspace.findMany({
    where: {
      isDeleted: false,
      isActive: true,
      members: {
        some: { userId: { in: userIds }, role: "ADMIN" },
      },
    },
    include: {
      members: {
        where: { role: "ADMIN", userId: { in: userIds } },
        select: { userId: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const workspacesToDeactivateIds: string[] = [];
  const workspacesPerUser = new Map<string, typeof allUserAdminWorkspaces>();

  // Group by user
  for (const ws of allUserAdminWorkspaces) {
    for (const member of ws.members) {
      if (!workspacesPerUser.has(member.userId)) {
        workspacesPerUser.set(member.userId, []);
      }
      workspacesPerUser.get(member.userId)!.push(ws);
    }
  }

  // Calculate excess workspaces per user
  if (maxWorkspaces !== -1) {
    for (const workspaces of workspacesPerUser.values()) {
      if (workspaces.length > maxWorkspaces) {
        const excess = workspaces.slice(maxWorkspaces);
        for (const ws of excess) {
          if (!workspacesToDeactivateIds.includes(ws.id)) {
            workspacesToDeactivateIds.push(ws.id);
          }
        }
      }
    }

    if (workspacesToDeactivateIds.length > 0) {
      await Promise.all([
        prisma.workspace.updateMany({
          where: { id: { in: workspacesToDeactivateIds } },
          data: { isActive: false },
        }),
        prisma.board.updateMany({
          where: {
            workspaceId: { in: workspacesToDeactivateIds },
          },
          data: { isActive: false },
        }),
      ]);
    }
  }

  // Handle Boards limit across active workspaces in bulk
  const allUserAdminBoards = await prisma.board.findMany({
    where: {
      isDeleted: false,
      isActive: true,
      workspace: {
        isDeleted: false,
        isActive: true,
        // Exclude workspaces we just deactivated
        id: { notIn: workspacesToDeactivateIds },
        members: {
          some: { userId: { in: userIds }, role: "ADMIN" },
        },
      },
    },
    include: {
      workspace: {
        include: {
          members: {
            where: { role: "ADMIN", userId: { in: userIds } },
            select: { userId: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const boardsToDeactivateIds: string[] = [];
  const boardsPerUser = new Map<string, typeof allUserAdminBoards>();

  // Group by user
  for (const board of allUserAdminBoards) {
    // board must belong to a workspace which has an admin member among userIds
    if (board.workspace && board.workspace.members) {
      for (const member of board.workspace.members) {
        if (!boardsPerUser.has(member.userId)) {
          boardsPerUser.set(member.userId, []);
        }
        boardsPerUser.get(member.userId)!.push(board);
      }
    }
  }

  // Calculate excess boards per user
  if (maxActiveBoards !== -1) {
    for (const boards of boardsPerUser.values()) {
      if (boards.length > maxActiveBoards) {
        const excess = boards.slice(maxActiveBoards);
        for (const board of excess) {
          if (!boardsToDeactivateIds.includes(board.id)) {
            boardsToDeactivateIds.push(board.id);
          }
        }
      }
    }

    if (boardsToDeactivateIds.length > 0) {
      await prisma.board.updateMany({
        where: { id: { in: boardsToDeactivateIds } },
        data: { isActive: false },
      });
    }
  }
}
