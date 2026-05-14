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
  };
}>;

export type DashboardWorkspace = Prisma.WorkspaceGetPayload<{
  include: {
    boards: true;
  };
}>;

export type PlanWithPrices = Prisma.PlanGetPayload<{
  include: {
    prices: true;
  };
}>;
