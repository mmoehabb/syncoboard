import { describe, it, expect, mock, beforeEach, afterEach } from "bun:test";

const mockAuth = mock();

mock.module("@/lib/auth", () => ({
  auth: mockAuth,
  getSessionOrPat: mock().mockImplementation(async () => {
    try {
      const s = await mockAuth();
      return s?.user?.id;
    } catch {
      return null;
    }
  }),
  getSessionOrPat: mock().mockImplementation(async () => {
    try {
      const s = await mockAuth();
      return s?.user?.id;
    } catch {
      return null;
    }
  }),
}));

mock.module("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => body,
      __isMock: true,
    }),
  },
}));

const mockPrisma = {
  user: {
    findFirst: mock(),
  },
  plan: {
    findFirst: mock(),
  },
  subscription: {
    create: mock(),
  },
};

mock.module("@syncoboard/db", () => ({
  prisma: mockPrisma,
}));

// We must import the module dynamically to make sure the mocks above are applied
let POST: unknown;
let originalConsoleError: unknown;

describe("POST /api/subscriptions", () => {
  beforeEach(async () => {
    mockAuth.mockReset();
    mockPrisma.user.findFirst.mockReset();
    mockPrisma.plan.findFirst.mockReset();
    mockPrisma.subscription.create.mockReset();

    originalConsoleError = console.error;
    console.error = mock();

    const imported = await import("@/app/api/subscriptions/route");
    POST = imported.POST;
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it("should fail when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);
    const response = await POST();
    const data = await response.json();
    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("should fail if user already has an active subscription", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockPrisma.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      subscriptions: [{ status: "ACTIVE" }],
    });

    const response = await POST();
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("User already has an active subscription");
  });

  it("should fail if free plan is not found", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockPrisma.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      subscriptions: [],
    });
    mockPrisma.plan.findFirst.mockResolvedValueOnce(null);

    const response = await POST();
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe("Free plan not found");
  });

  it("should create a subscription if everything is correct", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    mockPrisma.user.findFirst.mockResolvedValueOnce({
      id: "user-1",
      subscriptions: [],
    });
    const mockFreePlan = {
      id: "plan-1",
      name: "Free",
      prices: [{ id: "price-1" }],
    };
    mockPrisma.plan.findFirst.mockResolvedValueOnce(mockFreePlan);

    const mockCreatedSubscription = {
      id: "sub-1",
      userId: "user-1",
      priceId: "price-1",
      status: "ACTIVE",
    };
    mockPrisma.subscription.create.mockResolvedValueOnce(
      mockCreatedSubscription,
    );

    const response = await POST();
    const data = await response.json();
    expect(response.status).toBe(201);
    expect(data.subscription).toEqual(mockCreatedSubscription);

    // Verify subscription.create was called with correct args
    expect(mockPrisma.subscription.create).toHaveBeenCalledTimes(1);
    const createArgs = mockPrisma.subscription.create.mock.calls[0][0];
    expect(createArgs.data.userId).toBe("user-1");
    expect(createArgs.data.priceId).toBe("price-1");
    expect(createArgs.data.status).toBe("ACTIVE");
    expect(createArgs.data.cancelAtPeriodEnd).toBe(false);
  });

  it("should return internal server error if an exception occurs", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-1" } });
    const testError = new Error("Database error");
    mockPrisma.user.findFirst.mockRejectedValueOnce(testError);

    const response = await POST();
    const data = await response.json();
    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to subscribe to free plan");
    expect(console.error).toHaveBeenCalledWith(
      "Error subscribing to free plan:",
      testError,
    );
  });
});
