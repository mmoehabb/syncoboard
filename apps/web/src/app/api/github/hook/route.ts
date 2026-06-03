import { NextRequest, NextResponse } from "next/server";
import { Prisma, prisma } from "@syncoboard/db";
import stringSimilarity from "string-similarity";
import { TaskStatus } from "@prisma/client";
import { SIMILARITY_THRESHOLD } from "@/lib/constants";
import {
  PullRequestEvent,
  PullRequestReviewEvent,
  PullRequest,
  SimplePullRequest,
  User,
  Team,
  PullRequestReview,
} from "@octokit/webhooks-types";
import { API_ERRORS, apiError } from "@/lib/api/error";
import {
  verifySignature,
  determineTaskStatus,
} from "@/lib/utils/github/webhook";

type GitHubUser = { login: string; avatar_url: string; id: number };

function isGitHubUser(reviewer: User | Team): reviewer is User {
  return "login" in reviewer && "avatar_url" in reviewer && "id" in reviewer;
}

async function resolveUsers(githubUsers: User[]): Promise<{
  registeredIds: string[];
  unregisteredUsers: { login: string; avatar_url: string }[];
}> {
  const registeredIds: string[] = [];
  const unregisteredUsers: { login: string; avatar_url: string }[] = [];

  const userIds = githubUsers.map((u) => String(u.id));
  const accounts = await prisma.account.findMany({
    where: {
      provider: "github",
      providerAccountId: { in: userIds },
    },
  });

  const accountMap = new Map(
    accounts.map((a) => [a.providerAccountId, a.userId]),
  );

  for (const user of githubUsers) {
    const userId = accountMap.get(String(user.id));
    if (userId) {
      registeredIds.push(userId);
    } else {
      unregisteredUsers.push({
        login: user.login,
        avatar_url: user.avatar_url,
      });
    }
  }

  return { registeredIds, unregisteredUsers };
}

export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();

    if (!verifySignature(req, bodyText)) {
      return apiError(API_ERRORS.customUnauthorized("Invalid signature"));
    }

    const payload = JSON.parse(bodyText);
    const event = req.headers.get("x-github-event");

    if (event !== "pull_request" && event !== "pull_request_review") {
      return NextResponse.json({ message: "Ignored event type" });
    }

    let action: string;
    let pr: PullRequest | SimplePullRequest;
    let repo: { id: number };
    let review: PullRequestReview | undefined;

    if (event === "pull_request") {
      const prEvent = payload as PullRequestEvent;
      action = prEvent.action;
      pr = prEvent.pull_request;
      repo = prEvent.repository;
    } else {
      const reviewEvent = payload as PullRequestReviewEvent;
      action = reviewEvent.action;
      pr = reviewEvent.pull_request;
      repo = reviewEvent.repository;
      review = reviewEvent.review;
    }

    if (!pr || !repo) {
      return apiError(API_ERRORS.customBadRequest("Invalid payload"));
    }

    const repoIdStr = String(repo.id);

    const board = await prisma.board.findFirst({
      where: { githubRepoId: repoIdStr },
    });

    if (!board) {
      return NextResponse.json({ message: "Board not found for repo" });
    }

    const status = determineTaskStatus(event, action, pr, review);

    // Process assignees and reviewers
    const assignees = pr.assignees || [];
    const requestedReviewers = (pr.requested_reviewers || []).filter(
      isGitHubUser,
    );

    const {
      registeredIds: registeredAssignees,
      unregisteredUsers: unregisteredAssignees,
    } = await resolveUsers(assignees);
    const {
      registeredIds: registeredReviewers,
      unregisteredUsers: unregisteredReviewers,
    } = await resolveUsers(requestedReviewers);

    const updateData: Prisma.TaskUpdateInput = {
      title: pr.title,
      description: pr.body || "",
      branchName: pr.head.ref,
      assignees: {
        set: registeredAssignees.map((id) => ({ id })),
      },
      reviewers: {
        set: registeredReviewers.map((id) => ({ id })),
      },
      unregisteredAssignees: JSON.stringify(unregisteredAssignees),
      unregisteredReviewers: JSON.stringify(unregisteredReviewers),
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    // See if task with this PR already exists
    const existingTask = await prisma.task.findFirst({
      where: {
        boardId: board.id,
        prNumber: pr.number,
      },
    });

    if (existingTask) {
      await prisma.task.update({
        where: { id: existingTask.id },
        data: updateData,
      });
      return NextResponse.json({ message: "Task updated" });
    }

    // Action is created/opened, try to find 90% matching unlinked task
    if (action === "opened") {
      const unlinkedTasks = await prisma.task.findMany({
        where: {
          boardId: board.id,
          prNumber: null,
        },
      });

      if (unlinkedTasks.length > 0) {
        const titles = unlinkedTasks.map((t) => t.title);
        const match = stringSimilarity.findBestMatch(pr.title, titles);

        if (match.bestMatch.rating >= SIMILARITY_THRESHOLD) {
          const matchedTask = unlinkedTasks[match.bestMatchIndex];

          const linkedUpdateData: Prisma.TaskUpdateInput = {
            ...updateData,
            prNumber: pr.number,
            description: matchedTask.description || pr.body || "",
          };

          await prisma.task.update({
            where: { id: matchedTask.id },
            data: linkedUpdateData,
          });
          return NextResponse.json({ message: "Task linked and updated" });
        }
      }
    }

    // Otherwise create a new task
    let createStatus = status;
    if (createStatus === undefined) {
      createStatus = pr.draft ? TaskStatus.TODO : TaskStatus.IN_PROGRESS;
    }

    await prisma.task.create({
      data: {
        boardId: board.id,
        title: pr.title,
        description: pr.body || "",
        status: createStatus,
        prNumber: pr.number,
        branchName: pr.head.ref,
        assignees: {
          connect: registeredAssignees.map((id) => ({ id })),
        },
        reviewers: {
          connect: registeredReviewers.map((id) => ({ id })),
        },
        unregisteredAssignees: JSON.stringify(unregisteredAssignees),
        unregisteredReviewers: JSON.stringify(unregisteredReviewers),
      },
    });

    return NextResponse.json({ message: "Task created" });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return apiError(API_ERRORS.customInternal(errorMessage));
  }
}
