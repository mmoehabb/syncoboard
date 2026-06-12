import { test, describe, beforeEach, mock, expect } from "bun:test";

// Mocking prisma globally
mock.module("@syncoboard/db", () => ({
  prisma: {
    subscription: {
      findFirst: mock(),
      findMany: mock(),
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

type MockFn = {
  mockClear(): void;
  mockResolvedValue(v: unknown): void;
  mockImplementation(fn: (...args: unknown[]) => unknown): void;
};

describe("enforceSubscriptionLimits Performance Benchmark", () => {
  let prismaMock: {
    subscription: { findFirst: MockFn; findMany: MockFn };
    plan: { findFirst: MockFn };
    workspace: { findMany: MockFn; updateMany: MockFn };
    board: { findMany: MockFn; updateMany: MockFn };
  };

  beforeEach(async () => {
    const db = await import("@syncoboard/db");
    prismaMock = db.prisma as unknown as typeof prismaMock;
    // Reset mocks safely
    if (prismaMock.subscription?.findFirst?.mockClear)
      prismaMock.subscription.findFirst.mockClear();
    if (prismaMock.subscription?.findMany?.mockClear)
      prismaMock.subscription.findMany.mockClear();
    if (prismaMock.plan?.findFirst?.mockClear)
      prismaMock.plan.findFirst.mockClear();
    if (prismaMock.workspace?.findMany?.mockClear)
      prismaMock.workspace.findMany.mockClear();
    if (prismaMock.workspace?.updateMany?.mockClear)
      prismaMock.workspace.updateMany.mockClear();
    if (prismaMock.board?.findMany?.mockClear)
      prismaMock.board.findMany.mockClear();
    if (prismaMock.board?.updateMany?.mockClear)
      prismaMock.board.updateMany.mockClear();
  });

  test("benchmark sequential vs bulk concurrent updates for 50 users", async () => {
    const { enforceSubscriptionLimits, enforceBulkSubscriptionLimits } =
      await import("../src/subscription-limits");

    // Setup generic mock responses
    prismaMock.subscription.findFirst.mockResolvedValue(null);
    prismaMock.plan.findFirst.mockResolvedValue({
      maxWorkspaces: 1,
      maxActiveBoards: 1,
    });

    // Simulate finding 3 workspaces per user
    prismaMock.workspace.findMany.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve([
                {
                  id: "ws3",
                  members: [{ userId: "user-test" }],
                  createdAt: new Date("2024-03-01"),
                },
                {
                  id: "ws2",
                  members: [{ userId: "user-test" }],
                  createdAt: new Date("2024-02-01"),
                },
                {
                  id: "ws1",
                  members: [{ userId: "user-test" }],
                  createdAt: new Date("2024-01-01"),
                },
              ]),
            5,
          ),
        ),
    );
    prismaMock.board.findMany.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 5)),
    );

    prismaMock.workspace.updateMany.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5)),
    );
    prismaMock.board.updateMany.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5)),
    );

    const users = Array.from({ length: 50 }).map((_, i) => `user-${i}`);

    // --- Original N+1 Performance ---
    const startOriginal = performance.now();
    await Promise.all(users.map((u) => enforceSubscriptionLimits(u, null)));
    const endOriginal = performance.now();
    const timeOriginal = endOriginal - startOriginal;
    console.log(`Original N+1 execution time for 50 users: ${timeOriginal}ms`);

    // --- Bulk Performance ---
    // Make sure bulk finds the right amount of workspaces to simulate
    const bulkWorkspaces = [];
    for (let i = 0; i < 50; i++) {
      bulkWorkspaces.push({
        id: `ws3-${i}`,
        members: [{ userId: `user-${i}` }],
        createdAt: new Date("2024-03-01"),
      });
      bulkWorkspaces.push({
        id: `ws2-${i}`,
        members: [{ userId: `user-${i}` }],
        createdAt: new Date("2024-02-01"),
      });
      bulkWorkspaces.push({
        id: `ws1-${i}`,
        members: [{ userId: `user-${i}` }],
        createdAt: new Date("2024-01-01"),
      });
    }
    prismaMock.workspace.findMany.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(bulkWorkspaces), 5)),
    );

    const startBulk = performance.now();
    await enforceBulkSubscriptionLimits(users);
    const endBulk = performance.now();
    const timeBulk = endBulk - startBulk;
    console.log(`Bulk execution time for 50 users: ${timeBulk}ms`);

    // The bulk function should be significantly faster because it uses a single db query instead of 50.
    // Given the simulated 5ms per query latency, N+1 will take at least 50 * 5ms (or parallelized still slower).
    // Let's assert it's faster.
    expect(timeBulk).toBeLessThan(timeOriginal);
  });
});
