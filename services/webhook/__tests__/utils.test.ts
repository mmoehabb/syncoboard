import { describe, expect, it } from "bun:test";
import { determineTaskStatus } from "../src/utils";
import type { PullRequest, PullRequestReview } from "@octokit/webhooks-types";

describe("determineTaskStatus", () => {
  describe("event: pull_request", () => {
    it("should return TODO if PR is a draft, except for closed", () => {
      const pr = { draft: true } as PullRequest;
      expect(determineTaskStatus("pull_request", "opened", pr)).toBe("TODO");
      expect(determineTaskStatus("pull_request", "ready_for_review", pr)).toBe(
        "TODO",
      );
      expect(determineTaskStatus("pull_request", "closed", pr)).toBe("CLOSED");
    });

    it("should return IN_PROGRESS when action is opened and not a draft", () => {
      const pr = { draft: false } as PullRequest;
      expect(determineTaskStatus("pull_request", "opened", pr)).toBe(
        "IN_PROGRESS",
      );
    });

    it("should return IN_REVIEW when action is ready_for_review", () => {
      const pr = { draft: false } as PullRequest;
      expect(determineTaskStatus("pull_request", "ready_for_review", pr)).toBe(
        "IN_REVIEW",
      );
    });

    it("should return IN_REVIEW when action is review_requested", () => {
      const pr = { draft: false } as PullRequest;
      expect(determineTaskStatus("pull_request", "review_requested", pr)).toBe(
        "IN_REVIEW",
      );
    });

    it("should return IN_PROGRESS when action is review_request_removed", () => {
      const pr = { draft: false } as PullRequest;
      expect(
        determineTaskStatus("pull_request", "review_request_removed", pr),
      ).toBe("IN_PROGRESS");
    });

    it("should return DONE when action is closed and PR is merged", () => {
      const pr = { draft: false, merged: true } as PullRequest;
      expect(determineTaskStatus("pull_request", "closed", pr)).toBe("DONE");
    });

    it("should return CLOSED when action is closed and PR is not merged", () => {
      const pr = { draft: false, merged: false } as PullRequest;
      expect(determineTaskStatus("pull_request", "closed", pr)).toBe("CLOSED");
    });

    it("should return CLOSED when action is closed and PR does not have merged property", () => {
      // Testing SimplePullRequest like structure without merged property
      const pr = { draft: false } as PullRequest;
      expect(determineTaskStatus("pull_request", "closed", pr)).toBe("CLOSED");
    });

    it("should return IN_PROGRESS when action is reopened", () => {
      const pr = { draft: false } as PullRequest;
      expect(determineTaskStatus("pull_request", "reopened", pr)).toBe(
        "IN_PROGRESS",
      );
    });

    it("should return undefined for unhandled pull_request actions", () => {
      const pr = { draft: false } as PullRequest;
      expect(
        determineTaskStatus("pull_request", "assigned", pr),
      ).toBeUndefined();
      expect(
        determineTaskStatus("pull_request", "labeled", pr),
      ).toBeUndefined();
    });
  });

  describe("event: pull_request_review", () => {
    it("should return CHANGES_REQUESTED when action is submitted and review state is changes_requested", () => {
      const pr = { draft: false } as PullRequest;
      const review = { state: "changes_requested" } as PullRequestReview;
      expect(
        determineTaskStatus("pull_request_review", "submitted", pr, review),
      ).toBe("CHANGES_REQUESTED");
    });

    it("should return undefined when action is not submitted", () => {
      const pr = { draft: false } as PullRequest;
      const review = { state: "changes_requested" } as PullRequestReview;
      expect(
        determineTaskStatus("pull_request_review", "dismissed", pr, review),
      ).toBeUndefined();
    });

    it("should return undefined when review state is not changes_requested", () => {
      const pr = { draft: false } as PullRequest;
      const review = { state: "approved" } as PullRequestReview;
      expect(
        determineTaskStatus("pull_request_review", "submitted", pr, review),
      ).toBeUndefined();
    });

    it("should return undefined when review object is omitted", () => {
      const pr = { draft: false } as PullRequest;
      expect(
        determineTaskStatus("pull_request_review", "submitted", pr),
      ).toBeUndefined();
    });
  });

  describe("unhandled events", () => {
    it("should return undefined for unhandled events", () => {
      const pr = { draft: false } as PullRequest;
      expect(
        determineTaskStatus("issue_comment", "created", pr),
      ).toBeUndefined();
    });
  });
});
