import { describe, it, expect, beforeEach, afterAll, mock } from "bun:test";
import { POST } from "@/app/api/github/hook/route";
import { NextRequest } from "next/server";
import crypto from "crypto";

// We need to bypass the secret for tests if GITHUB_WEBHOOK_SECRET is not set,
// or set it explicitly so we can test signature verification.
process.env.GITHUB_WEBHOOK_SECRET = "test-secret";

// Mocking prisma globally
mock.module("@syncoboard/db", () => ({
  prisma: {
    task: {
      findFirst: mock(),
      create: mock(),
      findUnique: mock(),
      update: mock(),
      findMany: mock(),
    },
    board: {
      findFirst: mock(),
      findUnique: mock(),
    },
    workspace: {
      findUnique: mock(),
    },
    account: {
      findMany: mock().mockResolvedValue([]),
    },
  },
}));

describe("GitHub Webhook", () => {
  let testBoard: { id: string };
  let prismaMock: any;

  beforeEach(async () => {
    const db = await import("@syncoboard/db");
    prismaMock = db.prisma;
    testBoard = { id: "board-1" };

    // reset mocks safely
    if (prismaMock.task?.findFirst?.mockClear)
      prismaMock.task.findFirst.mockClear();
    if (prismaMock.task?.create?.mockClear) prismaMock.task.create.mockClear();
    if (prismaMock.task?.update?.mockClear) prismaMock.task.update.mockClear();
    if (prismaMock.task?.findMany?.mockClear)
      prismaMock.task.findMany.mockClear();
    if (prismaMock.board?.findFirst?.mockClear)
      prismaMock.board.findFirst.mockClear();
    if (prismaMock.account?.findMany?.mockClear)
      prismaMock.account.findMany.mockClear();
  });

  afterAll(async () => {});

  function createSignedRequest(
    body: Record<string, unknown>,
    event: string = "pull_request",
  ) {
    const bodyText = JSON.stringify(body);
    const hmac = crypto.createHmac(
      "sha256",
      process.env.GITHUB_WEBHOOK_SECRET!,
    );
    const signature = `sha256=${hmac.update(bodyText).digest("hex")}`;

    return new NextRequest("http://localhost:3000/api/github/hook", {
      method: "POST",
      headers: {
        "x-hub-signature-256": signature,
        "x-github-event": event,
      },
      body: bodyText,
    });
  }

  it("should return 401 for invalid signature", async () => {
    const req = new NextRequest("http://localhost:3000/api/github/hook", {
      method: "POST",
      headers: {
        "x-hub-signature-256": "sha256=invalid",
        "x-github-event": "pull_request",
      },
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Invalid signature");
  });

  it("should ignore non-pull_request events", async () => {
    const req = createSignedRequest({}, "push");
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Ignored event type");
  });

  it("should return 400 for invalid payload", async () => {
    const req = createSignedRequest({ action: "opened" });
    const response = await POST(req);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid payload");
  });

  it("should create a new task when PR is opened and no unlinked task matches", async () => {
    const payload = {
      action: "opened",
      pull_request: {
        number: 1,
        title: "Test PR",
        body: "Test PR body",
        draft: false,
        head: { ref: "feature-branch" },
      },
      repository: {
        id: 1296269, // Matches our test board
      },
    };
    prismaMock.task.findFirst.mockResolvedValueOnce(null);
    prismaMock.task.findMany.mockResolvedValueOnce([]);
    prismaMock.board.findFirst.mockResolvedValueOnce({
      id: "board-1",
      githubRepoId: "1296269",
    });
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.task.create.mockResolvedValueOnce({ id: "task-1" });

    const req = createSignedRequest(payload);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Task created");
  });

  it("should link to an existing unlinked task if title matches 90%", async () => {
    const payload = {
      action: "opened",
      pull_request: {
        number: 2,
        title: "Add awesome feature", // 100% match
        body: "Implementation",
        draft: false,
        head: { ref: "awesome-feature" },
      },
      repository: {
        id: 1296269,
      },
    };

    prismaMock.board.findFirst.mockResolvedValueOnce({
      id: "board-1",
      githubRepoId: "1296269",
    });
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.task.findFirst.mockResolvedValueOnce(null);
    prismaMock.task.findMany.mockResolvedValueOnce([
      {
        id: "task-1",
        boardId: testBoard.id,
        title: "Add awesome feature",
        description: "Initial plan",
        status: "TODO",
      },
    ]);
    prismaMock.task.update.mockResolvedValueOnce({ id: "task-1" });

    const req = createSignedRequest(payload);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Task linked and updated");
  });

  it("should update an existing task if the PR number already exists", async () => {
    const payload = {
      action: "closed",
      pull_request: {
        number: 3,
        title: "Existing PR updated",
        body: "Closed now",
        draft: false,
        merged: true,
        head: { ref: "existing-branch" },
      },
      repository: {
        id: 1296269,
      },
    };

    prismaMock.board.findFirst.mockResolvedValueOnce({
      id: "board-1",
      githubRepoId: "1296269",
    });
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.task.findFirst.mockResolvedValueOnce({
      id: "task-1",
      boardId: testBoard.id,
      title: "Existing PR",
      status: "IN_PROGRESS",
      prNumber: 3,
      branchName: "existing-branch",
    });
    prismaMock.task.update.mockResolvedValueOnce({ id: "task-1" });

    const req = createSignedRequest(payload);
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.message).toBe("Task updated");
  });

  it("should set task status to TODO for draft PRs", async () => {
    const payload = {
      action: "opened",
      pull_request: {
        number: 4,
        title: "Draft PR",
        body: "",
        draft: true,
        head: { ref: "draft-branch" },
      },
      repository: {
        id: 1296269,
      },
    };

    prismaMock.board.findFirst.mockResolvedValueOnce({
      id: "board-1",
      githubRepoId: "1296269",
    });
    prismaMock.account.findMany.mockResolvedValue([]);
    prismaMock.task.findFirst.mockResolvedValueOnce(null);
    prismaMock.task.findMany.mockResolvedValueOnce([]);
    prismaMock.task.create.mockResolvedValueOnce({ id: "task-2" });

    const req = createSignedRequest(payload);
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
