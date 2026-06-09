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

  const assigneeParam = resolvedSearchParams?.assignee
    ? String(resolvedSearchParams.assignee)
    : undefined;
  const reviewerParam = resolvedSearchParams?.reviewer
    ? String(resolvedSearchParams.reviewer)
    : undefined;
  const startDateParam = resolvedSearchParams?.startDate
    ? String(resolvedSearchParams.startDate)
    : undefined;
  const endDateParam = resolvedSearchParams?.endDate
    ? String(resolvedSearchParams.endDate)
    : undefined;

  const limitParam = resolvedSearchParams?.limit
    ? Number(resolvedSearchParams.limit)
    : 5;
  const limit = isNaN(limitParam) ? 5 : limitParam;

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
  });

  // Fetch only up to 5 tasks initially per status to limit the initial payload
  // Also fetch the total counts of tasks per status based on the search query
  const TASK_STATUSES = [
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "CHANGES_REQUESTED",
    "DONE",
    "CLOSED",
  ] as const;

  const tasksData = await Promise.all(
    TASK_STATUSES.map(async (status) => {
      const whereClause: any = {
        boardId,
        status,
        ...(searchQuery
          ? {
              title: {
                contains: searchQuery,
                mode: "insensitive",
              },
            }
          : {}),
      };

      if (assigneeParam) {
        whereClause.assignees = {
          some: { id: assigneeParam },
        };
      }

      if (reviewerParam) {
        whereClause.reviewers = {
          some: { id: reviewerParam },
        };
      }

      if (startDateParam || endDateParam) {
        const dateFilter: any = {};
        if (startDateParam) {
          dateFilter.gte = new Date(startDateParam);
        }
        if (endDateParam) {
          const end = new Date(endDateParam);
          end.setUTCHours(23, 59, 59, 999);
          dateFilter.lte = end;
        }
        whereClause.OR = [{ createdAt: dateFilter }, { updatedAt: dateFilter }];
      }

      const [tasks, count] = await Promise.all([
        prisma.task.findMany({
          where: whereClause,
          orderBy: { updatedAt: "desc" },
          take: limit === -1 ? undefined : limit,
          include: { assignees: true, reviewers: true },
        }),
        prisma.task.count({
          where: whereClause,
        }),
      ]);
      return { status, tasks, count };
    }),
  );

  const initialTasks = tasksData.flatMap((d) => d.tasks);
  const taskCounts = tasksData.reduce(
    (acc, d) => {
      acc[d.status] = d.count;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (!board) {
    redirect("/dashboard");
  }

  // Extend the board object with tasks for the client
  const boardWithTasks = {
    id: board.id,
    workspaceId: board.workspaceId,
    name: board.name,
    repositoryName: board.repositoryName,
    githubRepoId: board.githubRepoId,
    isActive: board.isActive,
    isDeleted: board.isDeleted,
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
    tasks: initialTasks,
  };

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

  // Fetch available members for filtering
  const members = await prisma.user.findMany({
    where: {
      OR: [
        { boardMembers: { some: { boardId: boardId } } },
        { workspaceMembers: { some: { workspaceId: board.workspaceId } } },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  });

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
        board={boardWithTasks}
        taskCounts={taskCounts}
        boardId={boardId}
        searchQuery={searchQuery}
        availableMembers={members}
        initialLimit={limit}
      />
    </SessionProvider>
  );
}
