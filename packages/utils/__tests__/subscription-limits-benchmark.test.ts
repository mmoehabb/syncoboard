import { expect, test, describe, beforeEach, mock, afterEach } from "bun:test";

// Mocking prisma globally
mock.module("@syncoboard/db", () => ({
  prisma: {
    subscription: {
      findFirst: mock(),
    },
    plan: {
      findFirst: mock(),
    },
    workspace: {
      findMany: mock(),
      updateMany: mock(),
    },
    board: {
      findMany: mock(),
      updateMany: mock(),
    },
  },
}));

describe("enforceSubscriptionLimits Performance Benchmark", () => {
  let prismaMock: any;

  beforeEach(async () => {
    const db = await import("@syncoboard/db");
    prismaMock = db.prisma;
    // Reset mocks safely
    if (prismaMock.subscription?.findFirst?.mockClear) {
      prismaMock.subscription.findFirst.mockClear();
    }
    if (prismaMock.plan?.findFirst?.mockClear) {
      prismaMock.plan.findFirst.mockClear();
    }
    if (prismaMock.workspace?.findMany?.mockClear) {
      prismaMock.workspace.findMany.mockClear();
    }
    if (prismaMock.workspace?.updateMany?.mockClear) {
      prismaMock.workspace.updateMany.mockClear();
    }
    if (prismaMock.board?.findMany?.mockClear) {
      prismaMock.board.findMany.mockClear();
    }
    if (prismaMock.board?.updateMany?.mockClear) {
      prismaMock.board.updateMany.mockClear();
    }
  });

  test("benchmark sequential vs concurrent updates", async () => {
    const { enforceSubscriptionLimits } =
      await import("../src/subscription-limits");
    const userId = "user-123";

    if (prismaMock.subscription?.findFirst?.mockResolvedValue) {
      prismaMock.subscription.findFirst.mockResolvedValue(null);
    }
    if (prismaMock.plan?.findFirst?.mockResolvedValue) {
      prismaMock.plan.findFirst.mockResolvedValue({
        maxWorkspaces: 1,
        maxActiveBoards: 1,
      });
    }

    if (prismaMock.workspace?.findMany?.mockResolvedValue) {
      prismaMock.workspace.findMany.mockResolvedValue([
        { id: "ws3", createdAt: new Date("2024-03-01") },
        { id: "ws2", createdAt: new Date("2024-02-01") },
        { id: "ws1", createdAt: new Date("2024-01-01") },
      ]);
    }

    if (prismaMock.board?.findMany?.mockResolvedValue) {
      prismaMock.board.findMany.mockResolvedValue([]);
    }

    // Simulate DB latency
    if (prismaMock.workspace?.updateMany?.mockImplementation) {
      prismaMock.workspace.updateMany.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    }
    if (prismaMock.board?.updateMany?.mockImplementation) {
      prismaMock.board.updateMany.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );
    }

    const start = performance.now();
    await enforceSubscriptionLimits(userId);
    const end = performance.now();

    console.log(`Execution time: ${end - start}ms`);
  });
});
