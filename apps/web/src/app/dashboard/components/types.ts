import { Prisma } from "@syncoboard/db";

export type UnregisteredUser = {
  login: string;
  avatar_url: string;
};

export type MainBoardTask = Prisma.TaskGetPayload<{
  include: {
    assignees: true;
    reviewers: true;
  };
}>;

export type MainBoardData = Prisma.BoardGetPayload<{
  include: {
    tasks: {
      include: {
        assignees: true;
        reviewers: true;
      };
    };
    members: {
      include: {
        user: true;
      };
    };
    workspace: true;
  };
}>;

export type DashboardWorkspace = Prisma.WorkspaceGetPayload<{
  include: {
    boards: {
      include: {
        tasks: {
          select: {
            status: true;
          };
        };
      };
    };
  };
}>;

export type PlanWithPrices = Prisma.PlanGetPayload<{
  include: {
    prices: true;
  };
}>;

export type TaskCounts = Record<string, number>;

export type AvailableMember = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};
