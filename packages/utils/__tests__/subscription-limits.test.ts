import { expect, test, describe, beforeEach, mock } from "bun:test";

type MockFn = {
  mockClear(): void;
  mockResolvedValue(v: unknown): void;
  mockRejectedValue(e: unknown): void;
  mock: { calls: Array<unknown[]> };
};

type MockPrisma = {
  subscription: { findFirst: MockFn };
  plan: { findFirst: MockFn };
  workspace: { findMany: MockFn; updateMany: MockFn };
  board: { findMany: MockFn; updateMany: MockFn };
};

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

describe("enforceSubscriptionLimits", () => {
  beforeEach(async () => {
    const { prisma } = (await import("@syncoboard/db")) as unknown as {
      prisma: MockPrisma;
    };
    // Reset mocks
    prisma.subscription.findFirst.mockClear();
    prisma.plan.findFirst.mockClear();
    prisma.workspace.findMany.mockClear();
    prisma.workspace.updateMany.mockClear();
    prisma.board.findMany.mockClear();
    prisma.board.updateMany.mockClear();
  });

  test("should downgrade workspaces to 1 and boards to 1 when no active subscription (fallback to free plan)", async () => {
    const { prisma } = (await import("@syncoboard/db")) as unknown as {
      prisma: MockPrisma;
    };
    const { enforceSubscriptionLimits } =
      await import("../src/subscription-limits");
    const userId = "user-123";

    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.plan.findFirst.mockResolvedValue({
      maxWorkspaces: 1,
      maxActiveBoards: 1,
    });

    prisma.workspace.findMany.mockResolvedValue([
      { id: "ws3", createdAt: new Date("2024-03-01") }, // Newest
      { id: "ws2", createdAt: new Date("2024-02-01") },
      { id: "ws1", createdAt: new Date("2024-01-01") }, // Oldest
    ]);

    prisma.board.findMany.mockResolvedValue([
      { id: "b3", createdAt: new Date("2024-03-01") }, // Newest
      { id: "b2", createdAt: new Date("2024-02-01") },
      { id: "b1", createdAt: new Date("2024-01-01") }, // Oldest
    ]);

    await enforceSubscriptionLimits(userId);

    // Verify workspace limit enforcement (1 allowed, so 2 deactivated)
    expect(prisma.workspace.updateMany.mock.calls.length).toBe(1);
    expect(
      (
        prisma.workspace.updateMany.mock.calls[0] as Array<
          Record<string, unknown>
        >
      )[0].where.id.in,
    ).toEqual(["ws2", "ws1"]);
    expect(
      (
        prisma.workspace.updateMany.mock.calls[0] as Array<
          Record<string, unknown>
        >
      )[0].data.isActive,
    ).toBe(false);

    // Verify board limit enforcement (1 allowed, so 2 deactivated)
    expect(prisma.board.updateMany.mock.calls.length).toBe(2);

    expect(
      (
        prisma.board.updateMany.mock.calls[0] as Array<Record<string, unknown>>
      )[0].where.workspaceId.in,
    ).toEqual(["ws2", "ws1"]);
    expect(
      (
        prisma.board.updateMany.mock.calls[0] as Array<Record<string, unknown>>
      )[0].data.isActive,
    ).toBe(false);

    expect(
      (
        prisma.board.updateMany.mock.calls[1] as Array<Record<string, unknown>>
      )[0].where.id.in,
    ).toEqual(["b2", "b1"]);
    expect(
      (
        prisma.board.updateMany.mock.calls[1] as Array<Record<string, unknown>>
      )[0].data.isActive,
    ).toBe(false);
  });

  test("should not deactivate if under the limits", async () => {
    const { prisma } = (await import("@syncoboard/db")) as unknown as {
      prisma: MockPrisma;
    };
    const { enforceSubscriptionLimits } =
      await import("../src/subscription-limits");
    const userId = "user-123";

    prisma.subscription.findFirst.mockResolvedValue({
      price: {
        plan: {
          maxWorkspaces: 3,
          maxActiveBoards: 5,
        },
      },
    });

    prisma.workspace.findMany.mockResolvedValue([
      { id: "ws2", createdAt: new Date("2024-02-01") },
      { id: "ws1", createdAt: new Date("2024-01-01") },
    ]);

    prisma.board.findMany.mockResolvedValue([
      { id: "b3", createdAt: new Date("2024-03-01") },
      { id: "b2", createdAt: new Date("2024-02-01") },
      { id: "b1", createdAt: new Date("2024-01-01") },
    ]);

    await enforceSubscriptionLimits(userId);

    // Limits are not exceeded, so no updates should occur
    expect(prisma.workspace.updateMany.mock.calls.length).toBe(0);
    expect(prisma.board.updateMany.mock.calls.length).toBe(0);
  });

  test("should handle unlimited plans (-1)", async () => {
    const { prisma } = (await import("@syncoboard/db")) as unknown as {
      prisma: MockPrisma;
    };
    const { enforceSubscriptionLimits } =
      await import("../src/subscription-limits");
    const userId = "user-123";

    prisma.subscription.findFirst.mockResolvedValue({
      price: {
        plan: {
          maxWorkspaces: -1,
          maxActiveBoards: -1,
        },
      },
    });

    // Even with many items, no deactivation
    const manyItems = Array.from({ length: 50 }).map((_, i) => ({
      id: `id-${i}`,
      createdAt: new Date(),
    }));
    prisma.workspace.findMany.mockResolvedValue(manyItems);
    prisma.board.findMany.mockResolvedValue(manyItems);

    await enforceSubscriptionLimits(userId);

    expect(prisma.workspace.updateMany.mock.calls.length).toBe(0);
    expect(prisma.board.updateMany.mock.calls.length).toBe(0);
  });
});
