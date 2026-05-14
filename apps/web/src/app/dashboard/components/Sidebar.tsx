"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Lightbulb,
  LightbulbOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardWorkspace } from "./types";
import { FocusedLabel } from "@/components/ui/FocusedLabel";

type FlatItem = {
  type: "workspace" | "board";
  id: string;
  label: string;
  isActive: boolean;
  isDeleted?: boolean;
};

export function Sidebar({
  workspaces,
  activeBoardId,
}: {
  workspaces: DashboardWorkspace[];
  activeBoardId?: string;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const flatItems: FlatItem[] = [];

  // Sort workspaces so soft-deleted are at the bottom
  const sortedWorkspaces = [...workspaces].sort((a, b) => {
    if (a.isDeleted && !b.isDeleted) return 1;
    if (!a.isDeleted && b.isDeleted) return -1;
    return 0;
  });

  sortedWorkspaces.forEach((ws) => {
    flatItems.push({
      type: "workspace",
      id: ws.id,
      label: ws.name,
      isActive: ws.isActive,
      isDeleted: ws.isDeleted,
    });
    if (!collapsed[ws.id]) {
      // Sort boards so soft-deleted are at the bottom
      const sortedBoards = ws.boards
        ? [...ws.boards].sort((a, b) => {
            if (a.isDeleted && !b.isDeleted) return 1;
            if (!a.isDeleted && b.isDeleted) return -1;
            return 0;
          })
        : [];

      sortedBoards.forEach((board) => {
        flatItems.push({
          type: "board",
          id: board.id,
          label: board.name,
          isActive: board.isActive,
          isDeleted: board.isDeleted,
        });
      });
    }
  });

  const toggleWorkspace = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="w-64 border-r border-white/10 bg-void-grey/50 flex flex-col font-mono text-sm transition-all cmd-container">
      <div className="p-4 border-b border-white/10 text-syntax-grey flex items-center justify-between">
        <span className="font-bold">Explorer</span>
        <FocusedLabel />
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {flatItems.length === 0 && (
          <div className="px-4 py-2 text-syntax-grey italic">
            No workspaces found
          </div>
        )}
        {flatItems.map((item) => {
          if (item.type === "workspace") {
            return (
              <div
                key={`ws-${item.id}`}
                className={`group relative ${!item.isActive ? "opacity-50" : ""} ${item.isDeleted ? "line-through opacity-40 text-syntax-grey/50" : ""}`}
              >
                <button
                  onClick={() => toggleWorkspace(item.id)}
                  className="w-full text-left px-4 py-1.5 flex items-center gap-2 hover:bg-white/5 text-syntax-grey [&.cmd-selected]:bg-white/10 [&.cmd-selected]:text-white cmd-selectable"
                >
                  {collapsed[item.id] ? (
                    <ChevronRight size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                  <span className="font-bold flex-1">{item.label}</span>
                  {item.isActive ? (
                    <div title="Active Workspace" className="mr-6">
                      <Lightbulb size={12} className="text-neon-pulse/80" />
                    </div>
                  ) : (
                    <div title="Inactive Workspace" className="mr-6">
                      <LightbulbOff size={12} className="text-syntax-grey/50" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => router.push("/settings")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded text-syntax-grey hover:text-white transition-all"
                  title="Add Board"
                >
                  <Plus size={14} />
                </button>
              </div>
            );
          }
          return (
            <div
              key={`b-${item.id}`}
              className={`group relative ${!item.isActive ? "opacity-50" : ""} ${item.isDeleted ? "line-through opacity-40 text-syntax-grey/50" : ""}`}
            >
              <button
                onClick={() => router.push(`/dashboard/b/${item.id}`)}
                className={`w-full text-left pl-10 pr-4 py-1.5 flex items-center gap-2 hover:bg-white/5 ${activeBoardId === item.id ? "bg-white/10 text-white border-l-2 border-git-green" : "text-syntax-grey border-l-2 border-transparent"} [&.cmd-selected]:bg-white/10 [&.cmd-selected]:text-white [&.cmd-selected]:border-git-green cmd-selectable`}
              >
                <span className="flex-1"># {item.label}</span>
                {item.isActive ? (
                  <div title="Active Board">
                    <Lightbulb
                      size={12}
                      className="text-git-green/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ) : (
                  <div title="Inactive Board">
                    <LightbulbOff
                      size={12}
                      className="text-syntax-grey/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
