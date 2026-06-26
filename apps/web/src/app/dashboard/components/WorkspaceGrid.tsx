import React, { useState } from "react";
import type { DashboardWorkspace } from "./types";
import { Plus } from "lucide-react";
import { AddWorkspaceModal } from "@/components/modals/AddWorkspaceModal";
import { useRouter } from "next/navigation";

export function WorkspaceGrid({
  workspaces,
}: {
  workspaces: DashboardWorkspace[];
}) {
  const router = useRouter();
  const [isAddWorkspaceModalOpen, setIsAddWorkspaceModalOpen] = useState(false);

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-mono text-white mb-6">Workspaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => {
            let activeBoards = 0;
            let totalTasks = 0;
            let pendingTasks = 0;
            let lastUpdate = new Date(0);

            ws.boards.forEach((board) => {
              if (board.isActive && !board.isDeleted) activeBoards++;
              if (new Date(board.updatedAt) > lastUpdate) {
                lastUpdate = new Date(board.updatedAt);
              }
              board.tasks.forEach((task) => {
                totalTasks++;
                if (task.status === "TODO" || task.status === "IN_PROGRESS" || task.status === "IN_REVIEW" || task.status === "CHANGES_REQUESTED") {
                  pendingTasks++;
                }
              });
            });

            return (
              <div
                key={ws.id}
                onClick={() => router.push(`/dashboard/w/${ws.id}`)}
                className="bg-obsidian-night border border-white/10 rounded p-6 hover:border-neon-pulse transition-colors cursor-pointer flex flex-col group cmd-container relative"
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 [.cmd-active-container_&]:opacity-100 transition-opacity">
                  <span className="text-xs font-mono text-neon-pulse">select</span>
                </div>
                <h3 className="text-xl font-bold font-mono text-white mb-2 truncate">
                  {ws.name}
                </h3>
                <div className="text-syntax-grey text-sm font-mono mb-4">
                  Last updated: {lastUpdate.getTime() > 0 ? lastUpdate.toLocaleDateString() : 'Never'}
                </div>
                <div className="mt-auto grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-syntax-grey uppercase tracking-wider font-mono">Active Boards</span>
                    <span className="text-lg text-white font-mono">{activeBoards}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-syntax-grey uppercase tracking-wider font-mono">Tasks</span>
                    <span className="text-lg text-white font-mono">{totalTasks}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-syntax-grey uppercase tracking-wider font-mono">Pending Tasks</span>
                    <span className="text-lg text-white font-mono">{pendingTasks}</span>
                  </div>
                </div>
              </div>
            );
          })}

          <div
            onClick={() => setIsAddWorkspaceModalOpen(true)}
            className="bg-void-grey border border-white/10 border-dashed rounded p-6 hover:border-git-green hover:bg-white/5 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px] cmd-container group relative"
          >
            <div className="absolute top-2 right-2 opacity-0 [.cmd-active-container_&]:opacity-100 transition-opacity">
               <span className="text-xs font-mono text-git-green">add</span>
            </div>
            <Plus size={32} className="text-syntax-grey group-hover:text-git-green mb-2 transition-colors" />
            <span className="text-syntax-grey font-mono group-hover:text-white transition-colors">Add Workspace</span>
          </div>
        </div>
      </div>
      <AddWorkspaceModal
        isOpen={isAddWorkspaceModalOpen}
        onConfirm={() => {
          setIsAddWorkspaceModalOpen(false);
          router.refresh();
        }}
        onCancel={() => setIsAddWorkspaceModalOpen(false)}
      />
    </div>
  );
}
