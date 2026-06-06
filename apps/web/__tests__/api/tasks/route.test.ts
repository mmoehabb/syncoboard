import { describe, it, expect, beforeEach, afterAll, mock } from "bun:test";
import { POST } from "@/app/api/tasks/route";

const mockPrisma = {
  boardMember: {
    findUnique: mock().mockResolvedValue(null),
  },
  board: {
    findUnique: mock().mockResolvedValue({ workspaceId: "ws1" }),
  },
  workspaceMember: {
    findUnique: mock().mockResolvedValue(null),
  },
  task: {
    create: mock().mockResolvedValue({
      id: BigInt(1),
      title: "Test",
      status: "TODO",
    }),
  },
};

mock.module("@syncoboard/db", () => ({
  prisma: mockPrisma,
}));

mock.module("@/lib/auth", () => ({
  getSessionOrPat: mock().mockImplementation(async () => {
    return "test-user-id";
  }),
  getSessionOrPat: mock().mockImplementation(async () => {
    return "test-user-id";
  }),
  auth: mock().mockImplementation(async () => {
    return { user: { id: (global as any).testUserId } };
  }),
}));

mock.module("@/lib/api/with-subscription", () => ({
  hasValidSubscription: mock().mockResolvedValue(true),
}));

mock.module("@/lib/api/error", () => ({
  API_ERRORS: {
    customForbidden: (msg: string) => ({ error: msg, status: 403 }),
    customBadRequest: (msg: string) => ({ error: msg, status: 400 }),
    UNAUTHORIZED: { error: "Unauthorized", status: 401 },
    customNotFound: (msg: string) => ({
      error: msg + " not found",
      status: 404,
    }),
    customInternal: (msg: string) => ({ error: msg, status: 500 }),
  },
  apiError: (err: any) => {
    return Response.json({ error: err.error }, { status: err.status });
  },
}));

describe("POST /api/tasks (IDOR Fix)", () => {
  beforeEach(() => {
    mockPrisma.workspaceMember.findUnique.mockClear();
    mockPrisma.boardMember.findUnique.mockClear();
    (global as any).testUserId = "user-123";
  });

  it("should deny task creation for a non-admin workspace member who is not on the board", async () => {
    mockPrisma.boardMember.findUnique.mockResolvedValueOnce(null);
    mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
      role: "MEMBER",
      workspaceId: "ws1",
      userId: "user-123",
    });

    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      body: JSON.stringify({ boardId: "board1", title: "Task 1" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized access to this board");
  });

  it("should allow task creation for a workspace admin even if not directly on the board", async () => {
    mockPrisma.boardMember.findUnique.mockResolvedValueOnce(null);
    mockPrisma.workspaceMember.findUnique.mockResolvedValueOnce({
      role: "ADMIN",
      workspaceId: "ws1",
      userId: "user-123",
    });

    const req = new Request("http://localhost:3000/api/tasks", {
      method: "POST",
      body: JSON.stringify({ boardId: "board1", title: "Task 1" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
  });
});
