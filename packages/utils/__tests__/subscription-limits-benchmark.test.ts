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
  beforeEach(async () => {
    const { prisma } = await import("@syncoboard/db");
    // Reset mocks
    (prisma.subscription.findFirst as any).mockClear();
    (prisma.plan.findFirst as any).mockClear();
    (prisma.workspace.findMany as any).mockClear();
    (prisma.workspace.updateMany as any).mockClear();
    (prisma.board.findMany as any).mockClear();
    (prisma.board.updateMany as any).mockClear();
  });

  test("benchmark sequential vs concurrent updates", async () => {
    const { prisma } = await import("@syncoboard/db");
    const { enforceSubscriptionLimits } =
      await import("../src/subscription-limits");
    const userId = "user-123";

    (prisma.subscription.findFirst as any).mockResolvedValue(null);
    (prisma.plan.findFirst as any).mockResolvedValue({
      maxWorkspaces: 1,
      maxActiveBoards: 1,
    });

    (prisma.workspace.findMany as any).mockResolvedValue([
      { id: "ws3", createdAt: new Date("2024-03-01") },
      { id: "ws2", createdAt: new Date("2024-02-01") },
      { id: "ws1", createdAt: new Date("2024-01-01") },
    ]);

    (prisma.board.findMany as any).mockResolvedValue([]);

    // Simulate DB latency
    (prisma.workspace.updateMany as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );
    (prisma.board.updateMany as any).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    const start = performance.now();
    await enforceSubscriptionLimits(userId);
    const end = performance.now();

    console.log(`Execution time: ${end - start}ms`);
  });
});
