import {
  expect,
  test,
  describe,
  beforeEach,
  mock,
  setSystemTime,
  afterEach,
} from "bun:test";
import { cleanupDeletedEntities } from "../src/cleanup";

// Use relative path for @syncoboard/db to bypass resolution issues in some environments
const DB_PATH = "../../db/index";

const mockPrisma = {
  board: {
    deleteMany: mock(),
  },
  workspace: {
    deleteMany: mock(),
  },
};

// Mocking prisma globally
mock.module(DB_PATH, () => ({
  prisma: mockPrisma,
}));

mock.module("@syncoboard/db", () => ({
  prisma: mockPrisma,
}));

// Accessing the mock directly instead of through import to ensure we use the mock
const prisma = mockPrisma;

describe("cleanupDeletedEntities", () => {
  const mockNow = new Date("2024-04-01T12:00:00Z");

  beforeEach(() => {
    setSystemTime(mockNow);
    // Reset mocks
    // @ts-expect-error mocking prisma for tests
    (prisma.board.deleteMany).mockReset();
    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.deleteMany).mockReset();
  });

  afterEach(() => {
    setSystemTime(); // Reset system time
  });

  test("should delete boards and workspaces older than 3 months", async () => {
    const threeMonthsAgo = new Date("2024-01-01T12:00:00Z");

    // @ts-expect-error mocking prisma for tests
    (prisma.board.deleteMany).mockResolvedValue({ count: 5 });
    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.deleteMany).mockResolvedValue({ count: 2 });

    const result = await cleanupDeletedEntities();

    expect(result).toEqual({ boards: 5, workspaces: 2 });

    // Verify board.deleteMany call
    expect(prisma.board.deleteMany).toHaveBeenCalledWith({
      where: {
        isDeleted: true,
        updatedAt: {
          lt: threeMonthsAgo,
        },
      },
    });

    // Verify workspace.deleteMany call
    expect(prisma.workspace.deleteMany).toHaveBeenCalledWith({
      where: {
        isDeleted: true,
        updatedAt: {
          lt: threeMonthsAgo,
        },
      },
    });
  });

  test("should return zero counts when nothing to delete", async () => {
    // @ts-expect-error mocking prisma for tests
    (prisma.board.deleteMany).mockResolvedValue({ count: 0 });
    // @ts-expect-error mocking prisma for tests
    (prisma.workspace.deleteMany).mockResolvedValue({ count: 0 });

    const result = await cleanupDeletedEntities();

    expect(result).toEqual({ boards: 0, workspaces: 0 });
  });

  test("should rethrow error and log it when prisma fails", async () => {
    const error = new Error("Database error");
    // @ts-expect-error mocking prisma for tests
    (prisma.board.deleteMany).mockRejectedValue(error);

    // Spy on console.error
    const consoleSpy = mock(() => {});
    const originalConsoleError = console.error;
    // @ts-expect-error mock console error
    console.error = consoleSpy;

    await expect(cleanupDeletedEntities()).rejects.toThrow("Database error");

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error during cleanup of deleted entities:",
      error,
    );

    // Restore console.error
    console.error = originalConsoleError;
  });
});
