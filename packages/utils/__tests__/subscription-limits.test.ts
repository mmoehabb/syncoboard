import { expect, test, describe, beforeEach, mock, afterEach } from "bun:test";
import { enforceSubscriptionLimits } from "../src/subscription-limits";
import { prisma } from "@syncoboard/db";

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
  beforeEach(() => {
    // Reset mocks
    // @ts-expect-error mocking prisma for tests
    (prisma.subscription.findFirst).mockReset();
    // @ts-expect-error mocking prisma for tests
    (prisma.plan.findFirst).mockReset();
    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.findMany).mockReset();
    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.updateMany).mockReset();
    // @ts-expect-error mocking prisma for tests
    (prisma.board.findMany).mockReset();
    // @ts-expect-error mocking prisma for tests
    (prisma.board.updateMany).mockReset();
  });

  test("should downgrade workspaces to 1 and boards to 1 when no active subscription (fallback to free plan)", async () => {
    const userId = "user-123";

    // @ts-expect-error mocking prisma for tests
    (prisma.subscription.findFirst).mockResolvedValue(null);
    // @ts-expect-error mocking prisma for tests
    (prisma.plan.findFirst).mockResolvedValue({
      maxWorkspaces: 1,
      maxActiveBoards: 1,
    });

    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.findMany).mockResolvedValue([
      { id: "ws3", createdAt: new Date("2024-03-01") }, // Newest
      { id: "ws2", createdAt: new Date("2024-02-01") },
      { id: "ws1", createdAt: new Date("2024-01-01") }, // Oldest
    ]);

    // @ts-expect-error mocking prisma for tests
    (prisma.board.findMany).mockResolvedValue([
      { id: "b3", createdAt: new Date("2024-03-01") }, // Newest
      { id: "b2", createdAt: new Date("2024-02-01") },
      { id: "b1", createdAt: new Date("2024-01-01") }, // Oldest
    ]);

    await enforceSubscriptionLimits(userId);

    // Verify workspace limit enforcement (1 allowed, so 2 deactivated)
    // @ts-expect-error mocking prisma for tests
    expect((prisma.workspace.updateMany).mock.calls.length).toBe(1);
    expect(
    // @ts-expect-error mocking prisma for tests
      (prisma.workspace.updateMany).mock.calls[0][0].where.id.in,
    ).toEqual(["ws2", "ws1"]);
    expect(
    // @ts-expect-error mocking prisma for tests
      (prisma.workspace.updateMany).mock.calls[0][0].data.isActive,
    ).toBe(false);

    // Verify board limit enforcement (1 allowed, so 2 deactivated)
    // @ts-expect-error mocking prisma for tests
    expect((prisma.board.updateMany).mock.calls.length).toBe(2);

    expect(
    // @ts-expect-error mocking prisma for tests
      (prisma.board.updateMany).mock.calls[0][0].where.workspaceId.in,
    ).toEqual(["ws2", "ws1"]);
    expect(
    // @ts-expect-error mocking prisma for tests
      (prisma.board.updateMany).mock.calls[0][0].data.isActive,
    ).toBe(false);

    expect(
    // @ts-expect-error mocking prisma for tests
      (prisma.board.updateMany).mock.calls[1][0].where.id.in,
    ).toEqual(["b2", "b1"]);
    expect(
    // @ts-expect-error mocking prisma for tests
      (prisma.board.updateMany).mock.calls[1][0].data.isActive,
    ).toBe(false);
  });

  test("should not deactivate if under the limits", async () => {
    const userId = "user-123";

    // @ts-expect-error mocking prisma for tests
    (prisma.subscription.findFirst).mockResolvedValue({
      price: {
        plan: {
          maxWorkspaces: 3,
          maxActiveBoards: 5,
        },
      },
    });

    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.findMany).mockResolvedValue([
      { id: "ws2", createdAt: new Date("2024-02-01") },
      { id: "ws1", createdAt: new Date("2024-01-01") },
    ]);

    // @ts-expect-error mocking prisma for tests
    (prisma.board.findMany).mockResolvedValue([
      { id: "b3", createdAt: new Date("2024-03-01") },
      { id: "b2", createdAt: new Date("2024-02-01") },
      { id: "b1", createdAt: new Date("2024-01-01") },
    ]);

    await enforceSubscriptionLimits(userId);

    // Limits are not exceeded, so no updates should occur
    // @ts-expect-error mocking prisma for tests
    expect((prisma.workspace.updateMany).mock.calls.length).toBe(0);
    // @ts-expect-error mocking prisma for tests
    expect((prisma.board.updateMany).mock.calls.length).toBe(0);
  });

  test("should handle unlimited plans (-1)", async () => {
    const userId = "user-123";

    // @ts-expect-error mocking prisma for tests
    (prisma.subscription.findFirst).mockResolvedValue({
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
    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.findMany).mockResolvedValue(manyItems);
    // @ts-expect-error mocking prisma for tests
    (prisma.board.findMany).mockResolvedValue(manyItems);

    await enforceSubscriptionLimits(userId);

    // @ts-expect-error mocking prisma for tests
    expect((prisma.workspace.updateMany).mock.calls.length).toBe(0);
    // @ts-expect-error mocking prisma for tests
    expect((prisma.board.updateMany).mock.calls.length).toBe(0);
  });
});
