import {
  describe,
  it,
  expect,
  mock,
  beforeEach,
  afterEach,
  setSystemTime,
} from "bun:test";

const mockPrisma = {
  subscription: {
    findFirst: mock(),
  },
};

mock.module("@syncoboard/db", () => ({
  prisma: mockPrisma,
}));

describe("hasValidSubscription", () => {
  const MOCK_NOW = new Date("2024-01-01T00:00:00.000Z");
  let hasValidSubscription: (userId: string) => Promise<boolean>;

  beforeEach(async () => {
    mockPrisma.subscription.findFirst.mockReset();
    setSystemTime(MOCK_NOW);

    // Dynamically import to ensure mocks are applied
    const module = await import("@/lib/api/with-subscription");
    hasValidSubscription = module.hasValidSubscription;
  });

  afterEach(() => {
    setSystemTime();
  });

  it("should return true if a valid active subscription exists", async () => {
    const userId = "user-123";
    mockPrisma.subscription.findFirst.mockResolvedValueOnce({
      id: "sub-1",
      userId,
      status: "ACTIVE",
      currentPeriodEnd: new Date("2024-01-02T00:00:00.000Z"),
    });

    const result = await hasValidSubscription(userId);

    expect(result).toBe(true);
    expect(mockPrisma.subscription.findFirst).toHaveBeenCalledWith({
      where: {
        userId,
        status: "ACTIVE",
        currentPeriodEnd: {
          gt: MOCK_NOW,
        },
      },
    });
  });

  it("should return false if no active subscription exists", async () => {
    const userId = "user-456";
    mockPrisma.subscription.findFirst.mockResolvedValueOnce(null);

    const result = await hasValidSubscription(userId);

    expect(result).toBe(false);
  });

  it("should propagate error if prisma query fails", async () => {
    const userId = "user-789";
    mockPrisma.subscription.findFirst.mockRejectedValueOnce(
      new Error("DB Error"),
    );

    await expect(hasValidSubscription(userId)).rejects.toThrow("DB Error");
  });
});
