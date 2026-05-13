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
  bugReport: {
    create: mock(),
  },
};

mock.module("@syncoboard/db", () => ({
  prisma: mockPrisma,
}));

// We must import the module dynamically to make sure the mocks above are applied
let POST: unknown;
let originalConsoleLog: unknown;
let originalConsoleError: unknown;

describe("POST /api/bugs", () => {
  beforeEach(async () => {
    mockAuth.mockReset();
    mockPrisma.bugReport.create.mockReset();

    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = mock();
    console.error = mock();

    const imported = await import("@/app/api/bugs/route");
    POST = imported.POST;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it("should successfully create a bug report in the database and not log to console", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-123" } });

    const payload = {
      message: "Test bug",
      stack: "Test stack trace",
      url: "http://localhost/test",
    };

    const mockCreatedBug = {
      id: "bug-uuid-7",
      ...payload,
      userId: "user-123",
    };

    mockPrisma.bugReport.create.mockResolvedValueOnce(mockCreatedBug);

    const req = {
      json: async () => payload,
      headers: {
        get: (key: string) => {
          return "127.0.0.1";
        },
      },
    };

    // @ts-expect-error mock req
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBe("bug-uuid-7");

    // Verify database integration
    expect(mockPrisma.bugReport.create).toHaveBeenCalledWith({
      data: {
        userId: "user-123",
        message: "Test bug",
        stack: "Test stack trace",
        url: "http://localhost/test",
      },
    });

    // Verify console logs are GONE
    expect(console.log).not.toHaveBeenCalled();
  });

  it("should handle anonymous bug reports by saving with null userId", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const payload = {
      message: "Anonymous bug",
    };

    mockPrisma.bugReport.create.mockResolvedValueOnce({
      id: "bug-anon",
      ...payload,
      userId: null,
    });

    const req = {
      json: async () => payload,
      headers: {
        get: (key: string) => {
          return "127.0.0.1";
        },
      },
    };

    // @ts-expect-error mock req
    const response = await POST(req);
    expect(response.status).toBe(201);

    expect(mockPrisma.bugReport.create).toHaveBeenCalledWith({
      data: {
        userId: undefined, // or null, depending on how auth() returns
        message: "Anonymous bug",
        stack: undefined,
        url: undefined,
      },
    });
  });

  it("should return bad request if message is missing", async () => {
    const payload = {};
    const req = {
      json: async () => payload,
      headers: {
        get: (key: string) => {
          return "127.0.0.1";
        },
      },
    };

    // @ts-expect-error mock req
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Message is required");
    expect(mockPrisma.bugReport.create).not.toHaveBeenCalled();
  });

  it("should return internal server error if database fails", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "user-123" } });
    mockPrisma.bugReport.create.mockRejectedValueOnce(new Error("DB error"));

    const payload = { message: "Bug report" };
    const req = {
      json: async () => payload,
      headers: {
        get: (key: string) => {
          return "127.0.0.1";
        },
      },
    };

    // @ts-expect-error mock req
    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Failed to report bug");
    expect(console.error).toHaveBeenCalled();
  });
});

it("should return bad request if message is too long", async () => {
  const payload = { message: "a".repeat(2001) };
  const req = {
    json: async () => payload,
    headers: {
      get: (key: string) => {
        return "127.0.0.2";
      },
    },
  };

    // @ts-expect-error mock req
  const response = await POST(req);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toBe("Message is too long");
});

it("should return bad request if stack trace is too long", async () => {
  const payload = { message: "Bug", stack: "a".repeat(5001) };
  const req = {
    json: async () => payload,
    headers: {
      get: (key: string) => {
        return "127.0.0.3";
      },
    },
  };

    // @ts-expect-error mock req
  const response = await POST(req);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toBe("Stack trace is too long");
});

it("should return bad request if url is too long", async () => {
  const payload = { message: "Bug", url: "a".repeat(2001) };
  const req = {
    json: async () => payload,
    headers: {
      get: (key: string) => {
        return "127.0.0.4";
      },
    },
  };

    // @ts-expect-error mock req
  const response = await POST(req);
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.error).toBe("URL is too long");
});

it("should return bad request if message is not a string", async () => {
  const payload = { message: { foo: "bar" } };
  const req = {
    json: async () => payload,
    headers: {
      get: (key: string) => "127.0.0.5",
    },
  };
    // @ts-expect-error mock req
  const response = await POST(req);
  const data = await response.json();
  expect(response.status).toBe(400);
  expect(data.error).toBe("Message must be a string");
});

it("should return bad request if stack is not a string", async () => {
  const payload = { message: "bug", stack: 123 };
  const req = {
    json: async () => payload,
    headers: {
      get: (key: string) => "127.0.0.6",
    },
  };
    // @ts-expect-error mock req
  const response = await POST(req);
  const data = await response.json();
  expect(response.status).toBe(400);
  expect(data.error).toBe("Stack must be a string");
});

it("should return bad request if url is not a string", async () => {
  const payload = { message: "bug", url: true };
  const req = {
    json: async () => payload,
    headers: {
      get: (key: string) => "127.0.0.7",
    },
  };
    // @ts-expect-error mock req
  const response = await POST(req);
  const data = await response.json();
  expect(response.status).toBe(400);
  expect(data.error).toBe("URL must be a string");
});
