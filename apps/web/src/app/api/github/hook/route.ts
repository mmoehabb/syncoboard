import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@syncoboard/db";
import stringSimilarity from "string-similarity";
import { TaskStatus } from "@prisma/client";
import { SIMILARITY_THRESHOLD } from "@/lib/constants";
import {
  PullRequestEvent,
  PullRequestReviewEvent,
} from "@octokit/webhooks-types";
import { API_ERRORS, apiError } from "@/lib/api/error";

function verifySignature(req: NextRequest, bodyText: string) {
  const signature = req.headers.get("x-hub-signature-256");
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret || !signature) return false;

  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(bodyText).digest("hex")}`;

  try {
    const sigBuf = Buffer.from(signature);
    const digestBuf = Buffer.from(digest);
    if (sigBuf.length !== digestBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, digestBuf);
  } catch (e) {
    console.error(e);
    return false;
  }
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
    let pr: any;
    let repo: any;
    let review: any;

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

    let status: TaskStatus | undefined = undefined;

    if (event === "pull_request") {
      if (pr.draft) {
        status = TaskStatus.TODO;
      } else if (action === "opened") {
        status = TaskStatus.IN_PROGRESS;
      } else if (
        action === "ready_for_review" ||
        action === "review_requested"
      ) {
        status = TaskStatus.IN_REVIEW;
      } else if (action === "review_request_removed") {
        status = TaskStatus.IN_PROGRESS;
      } else if (action === "closed") {
        if (pr.merged) {
          status = TaskStatus.DONE;
        } else {
          status = TaskStatus.CLOSED;
        }
      } else if (action === "reopened") {
        status = TaskStatus.IN_PROGRESS;
      }
    } else if (event === "pull_request_review") {
      if (action === "submitted" && review?.state === "changes_requested") {
        status = TaskStatus.CHANGES_REQUESTED;
      }
    }

    // Process assignees and reviewers
    const assignees = pr.assignees || [];
    const requestedReviewers = pr.requested_reviewers || [];

    const registeredAssignees: string[] = [];
    const unregisteredAssignees: { login: string; avatar_url: string }[] = [];

    const assigneeIds = assignees.map((a) => String(a.id));
    const assigneeAccounts = await prisma.account.findMany({
      where: {
        provider: "github",
        providerAccountId: { in: assigneeIds },
      },
    });

    const assigneeAccountMap = new Map(
      assigneeAccounts.map((a) => [a.providerAccountId, a.userId]),
    );

    for (const assignee of assignees) {
      const userId = assigneeAccountMap.get(String(assignee.id));
      if (userId) {
        registeredAssignees.push(userId);
      } else {
        unregisteredAssignees.push({
          login: assignee.login,
          avatar_url: assignee.avatar_url,
        });
      }
    }

    const registeredReviewers: string[] = [];
    const unregisteredReviewers: { login: string; avatar_url: string }[] = [];

    // The PR object has requested_reviewers (we can assume these are users, not teams, for our purposes right now, or filter if needed)
    // Actually, requested_reviewers can be User | Team. We'll only map those that have an 'id'.
    const reviewerIds = requestedReviewers
      .filter(
        (r): r is Extract<typeof r, { id: number }> =>
          "id" in r && "login" in r && "avatar_url" in r,
      )
      .map((r) => String(r.id));

    const reviewerAccounts = await prisma.account.findMany({
      where: {
        provider: "github",
        providerAccountId: { in: reviewerIds },
      },
    });

    const reviewerAccountMap = new Map(
      reviewerAccounts.map((a) => [a.providerAccountId, a.userId]),
    );

    for (const reviewer of requestedReviewers) {
      if (
        !("id" in reviewer) ||
        !("login" in reviewer) ||
        !("avatar_url" in reviewer)
      )
        continue; // skip teams

      const userId = reviewerAccountMap.get(String(reviewer.id));
      if (userId) {
        registeredReviewers.push(userId);
      } else {
        unregisteredReviewers.push({
          login: reviewer.login,
          avatar_url: reviewer.avatar_url,
        });
      }
    }

    // See if task with this PR already exists
    const existingTask = await prisma.task.findFirst({
      where: {
        boardId: board.id,
        prNumber: pr.number,
      },
    });

    if (existingTask) {
      const updateData: any = {
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
          const updateData: any = {
            prNumber: pr.number,
            branchName: pr.head.ref,
            description: matchedTask.description || pr.body || "",
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

          await prisma.task.update({
            where: { id: matchedTask.id },
            data: updateData,
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
