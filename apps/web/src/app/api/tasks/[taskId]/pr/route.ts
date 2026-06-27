import { NextResponse } from "next/server";
import { getSessionOrPat } from "@/lib/auth";
import { prisma } from "@syncoboard/db";
import { App } from "@octokit/app";
import { API_ERRORS, apiError } from "@/lib/api/error";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> },
) {
  const userId = await getSessionOrPat();
  if (!userId) {
    return apiError(API_ERRORS.UNAUTHORIZED);
  }

  try {
    const resolvedParams = await params;
    const taskId = resolvedParams.taskId;

    const task = await prisma.task.findUnique({
      where: { id: BigInt(taskId) },
      include: {
        board: {
          include: {
            workspace: true,
          },
        },
      },
    });

    if (!task) {
      return apiError(API_ERRORS.customNotFound("Task"));
    }

    if (
      !task.board.repositoryName ||
      !task.board.workspace.githubInstallationId
    ) {
      return apiError(
        API_ERRORS.customBadRequest(
          "Board is not linked to a GitHub repository",
        ),
      );
    }

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;

    if (!appId || !privateKey) {
      console.error("Missing GitHub App credentials in environment variables.");
      return apiError(API_ERRORS.customInternal("Server misconfiguration"));
    }

    const app = new App({ appId, privateKey });
    const octokit = await app.getInstallationOctokit(
      parseInt(task.board.workspace.githubInstallationId),
    );

    const [owner, repo] = task.board.repositoryName.split("/");

    // 1. Get default branch
    const repoData = await octokit.request("GET /repos/{owner}/{repo}", {
      owner,
      repo,
    });
    const defaultBranch = repoData.data.default_branch;

    // 2. Get default branch ref
    const refData = await octokit.request(
      "GET /repos/{owner}/{repo}/git/ref/heads/{ref}",
      {
        owner,
        repo,
        ref: defaultBranch,
      },
    );
    const defaultBranchSha = refData.data.object.sha;

    // 3. Create new branch
    const newBranchName = `task-${task.id}`;
    await octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner,
      repo,
      ref: `refs/heads/${newBranchName}`,
      sha: defaultBranchSha,
    });

    // 4. Create empty commit
    const commitData = await octokit.request(
      "POST /repos/{owner}/{repo}/git/commits",
      {
        owner,
        repo,
        message: `Initial commit for task ${task.id}`,
        tree: refData.data.object.sha,
        parents: [defaultBranchSha],
      },
    );

    // 5. Update branch ref
    await octokit.request("PATCH /repos/{owner}/{repo}/git/refs/heads/{ref}", {
      owner,
      repo,
      ref: newBranchName,
      sha: commitData.data.sha,
    });

    // 6. Create PR
    const prData = await octokit.request("POST /repos/{owner}/{repo}/pulls", {
      owner,
      repo,
      title: task.title,
      body: task.description || `Closes task ${task.id}`,
      head: newBranchName,
      base: defaultBranch,
      draft: true, // Create as draft by default
    });

    // 7. Update task in DB
    await prisma.task.update({
      where: { id: task.id },
      data: {
        prNumber: prData.data.number,
        branchName: newBranchName,
        status: "TODO", // Draft PRs are TODO
      },
    });

    return NextResponse.json({ success: true, prNumber: prData.data.number });
  } catch (error) {
    console.error("Error creating PR:", error);
    return apiError(API_ERRORS.customInternal("Failed to create pull request"));
  }
}
