"use client";

import { X, ExternalLink } from "lucide-react";
import { formatRelativeOrAbsoluteDate } from "@/lib/utils/date";

import type { MainBoardTask } from "./types";

export function TaskDetailsPanel({
  task,
  repositoryName,
  onClose,
}: {
  task: MainBoardTask;
  repositoryName?: string | null;
  onClose: () => void;
}) {
  if (!task) return null;

  const assignees = task.assignees || [];
  const reviewers = task.reviewers || [];
  const unregisteredAssignees =
    typeof task.unregisteredAssignees === "string"
      ? JSON.parse(task.unregisteredAssignees)
      : task.unregisteredAssignees || [];
  const unregisteredReviewers =
    typeof task.unregisteredReviewers === "string"
      ? JSON.parse(task.unregisteredReviewers)
      : task.unregisteredReviewers || [];

  const hasAssignees = assignees.length > 0 || unregisteredAssignees.length > 0;
  const hasReviewers = reviewers.length > 0 || unregisteredReviewers.length > 0;

  return (
    <div className="absolute inset-0 z-30 sm:relative sm:inset-auto sm:z-auto w-full sm:w-80 border-l border-white/10 bg-void-grey/95 sm:bg-void-grey/80 flex flex-col font-mono text-sm overflow-hidden backdrop-blur-sm sm:backdrop-blur-none">
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-obsidian-night">
        <span className="font-bold text-white">SYNC-{task.id.toString()}</span>
        <button
          onClick={onClose}
          className="p-1 text-syntax-grey hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold text-white mb-2 leading-tight">
            {task.title}
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-2 py-1 rounded bg-white/5 text-xs text-syntax-grey border border-white/10">
              {task.status}
            </span>
            {task.prNumber &&
              (repositoryName ? (
                <a
                  href={`https://github.com/${repositoryName}/pull/${task.prNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-1 rounded bg-git-green/10 text-xs text-git-green border border-git-green/20 hover:bg-git-green/20 transition-colors flex items-center gap-1"
                >
                  PR #{task.prNumber}
                  <ExternalLink size={12} />
                </a>
              ) : (
                <span className="px-2 py-1 rounded bg-git-green/10 text-xs text-git-green border border-git-green/20">
                  PR #{task.prNumber}
                </span>
              ))}
            {task.branchName && (
              <span className="px-2 py-1 rounded bg-neon-pulse/10 text-xs text-neon-pulse border border-neon-pulse/20">
                {task.branchName}
              </span>
            )}
          </div>
        </div>

        {/* People Section */}
        {(hasAssignees || hasReviewers) && (
          <div className="flex flex-col gap-4 py-4 border-t border-b border-white/10">
            {hasAssignees && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-syntax-grey uppercase tracking-wider">
                  Assignees
                </h4>
                <div className="flex flex-wrap gap-2">
                  {assignees.map(
                    (user: {
                      id: string;
                      name: string | null;
                      email: string | null;
                      image: string | null;
                    }) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/10"
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-neon-pulse/20 text-neon-pulse flex items-center justify-center text-[10px] font-bold">
                              {(user.name || user.email || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-white/80">
                          {user.name || user.email || "Unknown"}
                        </span>
                      </div>
                    ),
                  )}

                  {unregisteredAssignees.map(
                    (u: { login: string; avatar_url: string }, idx: number) => (
                      <div
                        key={`u-a-${idx}`}
                        className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/10"
                        title={`Not registered on Syncoboard (${u.login})`}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          {u.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover grayscale opacity-80"
                            />
                          ) : (
                            <div className="w-full h-full bg-syntax-grey/20 text-syntax-grey flex items-center justify-center text-[10px] font-bold">
                              ?
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-syntax-grey italic">
                          Anonymous
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {hasReviewers && (
              <div className="flex flex-col gap-2">
                <h4 className="text-xs font-bold text-syntax-grey uppercase tracking-wider">
                  Reviewers
                </h4>
                <div className="flex flex-wrap gap-2">
                  {reviewers.map(
                    (user: {
                      id: string;
                      name: string | null;
                      email: string | null;
                      image: string | null;
                    }) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/10"
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          {user.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={user.image}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-git-green/20 text-git-green flex items-center justify-center text-[10px] font-bold">
                              {(user.name || user.email || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-white/80">
                          {user.name || user.email || "Unknown"}
                        </span>
                      </div>
                    ),
                  )}

                  {unregisteredReviewers.map(
                    (u: { login: string; avatar_url: string }, idx: number) => (
                      <div
                        key={`u-r-${idx}`}
                        className="flex items-center gap-2 bg-white/5 px-2 py-1 rounded border border-white/10"
                        title={`Not registered on Syncoboard (${u.login})`}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden">
                          {u.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatar_url}
                              alt="Avatar"
                              className="w-full h-full object-cover grayscale opacity-80"
                            />
                          ) : (
                            <div className="w-full h-full bg-syntax-grey/20 text-syntax-grey flex items-center justify-center text-[10px] font-bold">
                              ?
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-syntax-grey italic">
                          Anonymous
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h4 className="text-xs font-bold text-syntax-grey uppercase tracking-wider">
            Description
          </h4>
          <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
            {task.description || (
              <span className="italic text-syntax-grey">
                No description provided.
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-6 border-t border-white/10">
          <div className="text-xs text-syntax-grey flex justify-between">
            <span>Created:</span>
            <span title={new Date(task.createdAt).toLocaleString()}>
              {formatRelativeOrAbsoluteDate(task.createdAt)}
            </span>
          </div>
          <div className="text-xs text-syntax-grey flex justify-between">
            <span>Updated:</span>
            <span title={new Date(task.updatedAt).toLocaleString()}>
              {formatRelativeOrAbsoluteDate(task.updatedAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
