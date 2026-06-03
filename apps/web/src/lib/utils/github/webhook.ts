import crypto from "crypto";
import { NextRequest } from "next/server";
import {
  PullRequest,
  SimplePullRequest,
  PullRequestReview,
} from "@octokit/webhooks-types";
import { TaskStatus } from "@prisma/client";

export function verifySignature(req: NextRequest, bodyText: string): boolean {
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

export function determineTaskStatus(
  event: string,
  action: string,
  pr: PullRequest | SimplePullRequest,
  review?: PullRequestReview,
): TaskStatus | undefined {
  if (event === "pull_request") {
    if (pr.draft) return TaskStatus.TODO;
    if (action === "opened") return TaskStatus.IN_PROGRESS;
    if (action === "ready_for_review" || action === "review_requested")
      return TaskStatus.IN_REVIEW;
    if (action === "review_request_removed") return TaskStatus.IN_PROGRESS;
    if (action === "closed")
      return "merged" in pr && pr.merged ? TaskStatus.DONE : TaskStatus.CLOSED;
    if (action === "reopened") return TaskStatus.IN_PROGRESS;
  } else if (event === "pull_request_review") {
    if (action === "submitted" && review?.state === "changes_requested") {
      return TaskStatus.CHANGES_REQUESTED;
    }
  }
  return undefined;
}
