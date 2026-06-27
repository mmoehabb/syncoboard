"use client";

import React, { useState } from "react";
import type { DashboardWorkspace } from "./types";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AddBoardModal } from "@/components/modals/AddBoardModal";

export function BoardGrid({
  workspace,
  isAdmin,
}: {
  workspace: DashboardWorkspace;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [isAddBoardModalOpen, setIsAddBoardModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center text-sm font-mono text-syntax-grey">
          <button
            onClick={() => router.push("/dashboard")}
            className="hover:text-white transition-colors"
          >
            Workspaces
          </button>
          <span className="mx-2">/</span>
          <span className="text-white">{workspace.name}</span>
        </div>
        <h2 className="text-2xl font-mono text-white mb-6">
          {workspace.name} Boards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspace.boards
            .filter((b) => !b.isDeleted)
            .map((board) => {
              let totalTasks = 0;
              let pendingTasks = 0;
              let completedTasks = 0;

              board.tasks.forEach((task) => {
                totalTasks++;
                if (task.status === "DONE" || task.status === "CLOSED") {
                  completedTasks++;
                } else {
                  pendingTasks++;
                }
              });

              return (
                <div
                  key={board.id}
                  onClick={() => router.push(`/dashboard/b/${board.id}`)}
                  className="bg-void-grey border border-white/10 rounded p-6 hover:border-neon-pulse transition-colors cursor-pointer flex flex-col group cmd-container relative"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 [.cmd-active-container_&]:opacity-100 transition-opacity">
                    <span className="text-xs font-mono text-neon-pulse">
                      select
                    </span>
                  </div>
                  <h3 className="text-xl font-bold font-mono text-white mb-2 truncate">
                    {board.name}
                  </h3>
                  <div className="text-syntax-grey text-sm font-mono mb-4">
                    Last updated:{" "}
                    {new Date(board.updatedAt).toLocaleDateString()}
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <span className="text-xs text-syntax-grey uppercase tracking-wider font-mono">
                        Pending Tasks
                      </span>
                      <span className="text-lg text-white font-mono">
                        {pendingTasks}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-syntax-grey uppercase tracking-wider font-mono">
                        Completed Tasks
                      </span>
                      <span className="text-lg text-white font-mono">
                        {completedTasks}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

          {isAdmin && (
            <div
              onClick={() => setIsAddBoardModalOpen(true)}
              className="bg-void-grey border border-white/10 border-dashed rounded p-6 hover:border-git-green hover:bg-white/5 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px] cmd-container group relative"
            >
              <div className="absolute top-2 right-2 opacity-0 [.cmd-active-container_&]:opacity-100 transition-opacity">
                <span className="text-xs font-mono text-git-green">add</span>
              </div>
              <Plus
                size={32}
                className="text-syntax-grey group-hover:text-git-green mb-2 transition-colors"
              />
              <span className="text-syntax-grey font-mono group-hover:text-white transition-colors">
                Add Board
              </span>
            </div>
          )}
        </div>
      </div>
      {isAdmin && (
        <AddBoardModal
          workspaceId={workspace.id}
          isOpen={isAddBoardModalOpen}
          onConfirm={() => {
            setIsAddBoardModalOpen(false);
            router.refresh();
          }}
          onCancel={() => setIsAddBoardModalOpen(false)}
        />
      )}
    </div>
  );
}
