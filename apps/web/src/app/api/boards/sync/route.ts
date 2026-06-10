import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma, TaskStatus } from "@syncoboard/db";
import { API_ERRORS, apiError } from "@/lib/api/error";
import { App } from "@octokit/app";

export async function POST(req: Request) {
  const userId = await getSessionOrPat();
  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  try {
    const body = await req.json();
    const { workspaceName, boardName } = body;

    if (!workspaceName || !boardName) {
      return apiError(API_ERRORS.customBadRequest("Workspace name and Board name are required"));
    }

    const board = await prisma.board.findFirst({
      where: {
        name: { equals: boardName, mode: "insensitive" },
        workspace: {
          name: { equals: workspaceName, mode: "insensitive" },
        },
      },
      include: {
        workspace: true,
        members: {
          where: { userId },
        },
        tasks: {
          where: { prNumber: { not: null } },
          select: { prNumber: true },
        },
      },
    });

    if (!board || board.members.length === 0) {
      return apiError(API_ERRORS.custom404("Board not found or unauthorized"));
    }

    const member = board.members[0];
    if (member.role !== "ADMIN") {
      return apiError(API_ERRORS.customForbidden("Only board admins can sync"));
    }

    if (!board.isActive) {
      return apiError(API_ERRORS.customForbidden("Board is not active"));
    }

    if (!board.repositoryName || !board.workspace.githubInstallationId) {
      return apiError(API_ERRORS.customBadRequest("Board is not linked to a GitHub repository"));
    }

    // Check last synced
    if (board.lastSyncedAt) {
      const now = new Date();
      const lastSync = board.lastSyncedAt;

      const isSameDay =
        now.getUTCFullYear() === lastSync.getUTCFullYear() &&
        now.getUTCMonth() === lastSync.getUTCMonth() &&
        now.getUTCDate() === lastSync.getUTCDate();

      if (isSameDay) {
        return apiError(API_ERRORS.customBadRequest("Board has already been synced today"));
      }
    }

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
      console.error("Missing GitHub App credentials in environment variables.");
      return apiError(API_ERRORS.customInternal("Server misconfiguration"));
    }

    const app = new App({
      appId,
      privateKey,
    });

    const octokit = await app.getInstallationOctokit(
      parseInt(board.workspace.githubInstallationId),
    );

    const [owner, repo] = board.repositoryName.split("/");

    const response = await octokit.request("GET /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      state: "open",
      per_page: 100,
      headers: {
        "x-github-api-version": "2022-11-28",
      },
    });

    const openPrs = response.data;
    const existingPrNumbers = new Set(board.tasks.map(t => t.prNumber).filter((n): n is number => n !== null));

    const newPrs = openPrs.filter((pr: { number: number }) => !existingPrNumbers.has(pr.number));

    const tasksToCreate = newPrs.map(
      (pr: {
        draft?: boolean;
        requested_reviewers?: unknown[] | null;
        title: string;
        body?: string | null;
        number: number;
        head: { ref: string };
      }) => {
        let status: TaskStatus = TaskStatus.TODO;

        if (pr.draft) {
          status = TaskStatus.TODO;
        } else if (
          pr.requested_reviewers &&
          pr.requested_reviewers.length > 0
        ) {
          status = TaskStatus.IN_REVIEW;
        } else {
          status = TaskStatus.TODO; // Default for regular open PR per user requirement
        }

        return {
          boardId: board.id,
          title: pr.title,
          description: pr.body || "",
          status,
          prNumber: pr.number,
          branchName: pr.head.ref,
        };
      }
    );

    if (tasksToCreate.length > 0) {
      await prisma.task.createMany({
        data: tasksToCreate,
      });
    }

    await prisma.board.update({
      where: { id: board.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({
      message: `Synced ${tasksToCreate.length} new pull requests successfully`
    });
  } catch (error) {
    console.error("Error syncing board:", error);
    return apiError(API_ERRORS.customInternal("Failed to sync board"));
  }
}
