"use client";

import React from "react";
import Image from "next/image";
import { MainBoardTask, UnregisteredUser } from "./types";
import { formatRelativeOrAbsoluteDate } from "@/lib/utils/date";

interface TaskRowProps {
  task: MainBoardTask;
  isSelected: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

export const TaskRow: React.FC<TaskRowProps> = ({
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
      className={`surface-panel p-2 rounded-md border transition-all cursor-pointer flex items-center justify-between gap-4 ${
        isSelected
          ? "border-git-green bg-git-green/5 shadow-md scale-[1.01]"
          : "border-white/10 bg-void-grey hover:border-white/20"
      } cmd-selectable [&.cmd-selected]:border-neon-pulse [&.cmd-selected]:bg-neon-pulse/5 [&.cmd-selected]:shadow-md [&.cmd-selected]:scale-[1.01]`}
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="text-syntax-grey font-mono text-xs whitespace-nowrap w-24 flex-shrink-0">
          SYNC-{task.id.toString()}
        </div>

        <div
          className={`font-mono text-sm truncate ${
            task.status === "DONE" || task.status === "CLOSED"
              ? "text-syntax-grey line-through"
              : "text-white"
          }`}
          title={task.title}
        >
          {task.title}
        </div>

        {task.prNumber && (
          <div className="text-syntax-grey font-mono text-[10px] border border-white/10 px-1.5 rounded flex-shrink-0">
            PR #{task.prNumber}
          </div>
        )}

        {task.branchName && (
          <div className="px-2 py-0.5 rounded-full bg-neon-pulse/10 text-neon-pulse text-[10px] font-mono lowercase flex-shrink-0 truncate max-w-[150px]">
            {task.branchName}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {/* People section */}
        {hasPeople && (
          <div className="flex items-center gap-2">
            {/* Assignees */}
            {(assignees.length > 0 || unregisteredAssignees.length > 0) && (
              <div className="flex -space-x-1.5">
                {assignees.map((user) => (
                  <div
                    key={user.id}
                    className="w-4 h-4 rounded-full overflow-hidden border border-void-grey relative group"
                    title={`Assignee: ${user.name || user.email || "Unknown"}`}
                  >
                    {user.image ? (
                      <Image
                        fill
                        sizes="16px"
                        src={user.image}
                        alt="Avatar"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neon-pulse/20 text-neon-pulse flex items-center justify-center text-[8px] font-bold">
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
                    className="w-4 h-4 rounded-full overflow-hidden border border-void-grey relative group"
                    title={`Assignee: Anonymous (${u.login})`}
                  >
                    {u.avatar_url ? (
                      <Image
                        fill
                        sizes="16px"
                        src={u.avatar_url}
                        alt="Avatar"
                        className="object-cover grayscale opacity-80"
                      />
                    ) : (
                      <div className="w-full h-full bg-syntax-grey/20 text-syntax-grey flex items-center justify-center text-[8px] font-bold">
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
                <div className="flex -space-x-1.5">
                  {reviewers.map((user) => (
                    <div
                      key={user.id}
                      className="w-4 h-4 rounded-full overflow-hidden border border-void-grey relative group"
                      title={`Reviewer: ${user.name || user.email || "Unknown"}`}
                    >
                      {user.image ? (
                        <Image
                          fill
                          sizes="16px"
                          src={user.image}
                          alt="Avatar"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-git-green/20 text-git-green flex items-center justify-center text-[8px] font-bold">
                          {(user.name || user.email || "?")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-[10px] font-mono text-syntax-grey opacity-70 w-20 text-right">
          {formatRelativeOrAbsoluteDate(task.updatedAt || task.createdAt)}
        </div>
      </div>
    </div>
  );
};
