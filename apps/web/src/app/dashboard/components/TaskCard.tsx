"use client";

import React from "react";
import { MainBoardTask, UnregisteredUser } from "./types";
import { formatRelativeOrAbsoluteDate } from "@/lib/utils/date";

interface TaskCardProps {
  task: MainBoardTask;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  onClick,
  onContextMenu,
}) => {
  const assignees = task.assignees || [];
  const reviewers = task.reviewers || [];

  let unregisteredAssignees: UnregisteredUser[] = [];
  if (typeof task.unregisteredAssignees === "string") {
    try {
      unregisteredAssignees = JSON.parse(
        task.unregisteredAssignees,
      ) as UnregisteredUser[];
    } catch {
      unregisteredAssignees = [];
    }
  } else if (Array.isArray(task.unregisteredAssignees)) {
    unregisteredAssignees = task.unregisteredAssignees as UnregisteredUser[];
  }

  let unregisteredReviewers: UnregisteredUser[] = [];
  if (typeof task.unregisteredReviewers === "string") {
    try {
      unregisteredReviewers = JSON.parse(
        task.unregisteredReviewers,
      ) as UnregisteredUser[];
    } catch {
      unregisteredReviewers = [];
    }
  } else if (Array.isArray(task.unregisteredReviewers)) {
    unregisteredReviewers = task.unregisteredReviewers as UnregisteredUser[];
  }

  const hasPeople =
    assignees.length > 0 ||
    reviewers.length > 0 ||
    unregisteredAssignees.length > 0 ||
    unregisteredReviewers.length > 0;

  return (
    <div
      onClick={onClick}
      onContextMenu={onContextMenu}
      className={`surface-panel p-3 rounded-md border transition-all cursor-pointer flex flex-col gap-2 ${
        isSelected
          ? "border-git-green bg-git-green/5 shadow-md scale-[1.01]"
          : "border-white/10 bg-void-grey hover:border-white/20"
      } cmd-selectable [&.cmd-selected]:border-neon-pulse [&.cmd-selected]:bg-neon-pulse/5 [&.cmd-selected]:shadow-md [&.cmd-selected]:scale-[1.01]`}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <div className="text-syntax-grey font-mono text-xs mb-1">
            SYNC-{task.id.toString()}{" "}
            {task.prNumber && `| PR #${task.prNumber}`}
          </div>
          <div
            className={`font-mono text-sm leading-relaxed ${
              task.status === "DONE" || task.status === "CLOSED"
                ? "text-syntax-grey line-through"
                : "text-white"
            }`}
          >
            {task.title}
          </div>
        </div>
        {task.branchName && (
          <div className="flex items-center gap-2 ml-2 shrink-0 mt-1">
            <span className="px-2 py-0.5 rounded-full bg-neon-pulse/10 text-neon-pulse text-[10px] font-mono lowercase">
              {task.branchName}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
        <div className="flex items-center gap-3">
          {/* People section */}
          {hasPeople && (
            <div className="flex items-center gap-3">
              {/* Assignees */}
              {(assignees.length > 0 || unregisteredAssignees.length > 0) && (
                <div className="flex -space-x-2">
                  {assignees.map((user) => (
                    <div
                      key={user.id}
                      className="w-5 h-5 rounded-full overflow-hidden border border-void-grey relative group"
                      title={`Assignee: ${user.name || user.email || "Unknown"}`}
                    >
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
                  ))}
                  {unregisteredAssignees.map((u, idx: number) => (
                    <div
                      key={`u-a-${idx}`}
                      className="w-5 h-5 rounded-full overflow-hidden border border-void-grey relative group"
                      title={`Assignee: Anonymous (${u.login}) - Not registered on Syncoboard`}
                    >
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
                  ))}
                </div>
              )}

              {/* Reviewers */}
              {(reviewers.length > 0 || unregisteredReviewers.length > 0) && (
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-syntax-grey font-mono tracking-tighter">
                    REV:
                  </span>
                  <div className="flex -space-x-2">
                    {reviewers.map((user) => (
                      <div
                        key={user.id}
                        className="w-5 h-5 rounded-full overflow-hidden border border-void-grey relative group"
                        title={`Reviewer: ${user.name || user.email || "Unknown"}`}
                      >
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
                    ))}
                    {unregisteredReviewers.map((u, idx: number) => (
                      <div
                        key={`u-r-${idx}`}
                        className="w-5 h-5 rounded-full overflow-hidden border border-void-grey relative group"
                        title={`Reviewer: Anonymous (${u.login}) - Not registered on Syncoboard`}
                      >
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end text-[10px] font-mono text-syntax-grey opacity-70 group-hover:opacity-100 transition-opacity">
          <div title={`Created: ${new Date(task.createdAt).toLocaleString()}`}>
            {formatRelativeOrAbsoluteDate(task.createdAt)}
          </div>
          {new Date(task.updatedAt).getTime() !==
            new Date(task.createdAt).getTime() && (
            <div
              title={`Updated: ${new Date(task.updatedAt).toLocaleString()}`}
              className="text-white/40"
            >
              ✎ {formatRelativeOrAbsoluteDate(task.updatedAt)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
