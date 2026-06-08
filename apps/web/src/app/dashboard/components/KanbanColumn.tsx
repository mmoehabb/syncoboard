"use client";

import { useState, useEffect } from "react";
import { TaskCard } from "./TaskCard";
import { getMoreTasks } from "../taskActions";
import type { TaskStatus } from "@syncoboard/db";
import type { MainBoardTask } from "./types";
import { FocusedLabel } from "@/components/ui/FocusedLabel";

interface KanbanColumnProps {
  group: {
    title: string;
    status: string;
    color: string;
  };
  groupTasks: MainBoardTask[];
  selectedTask: MainBoardTask | null;
  onTaskClick: (taskId: string) => void;
  onContextMenu: (e: React.MouseEvent, task: MainBoardTask) => void;
  totalCount?: number;
  boardId?: string;
  searchQuery?: string;
  onLoadMore?: (tasks: MainBoardTask[]) => void;
}

export function KanbanColumn({
  group,
  groupTasks,
  selectedTask,
  onTaskClick,
  onContextMenu,
  totalCount,
  boardId,
  searchQuery,
  onLoadMore,
}: KanbanColumnProps) {
  const [tasks, setTasks] = useState<MainBoardTask[]>(groupTasks);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = totalCount !== undefined ? tasks.length < totalCount : false;

  const loadMore = async () => {
    if (!boardId || isLoading || !hasMore) return;
    try {
      setIsLoading(true);
      const newTasksRaw = await getMoreTasks({
        boardId,
        status: group.status as TaskStatus,
        skip: tasks.length,
        take: 5,
        searchQuery,
      });
      const newTasks = newTasksRaw as unknown as MainBoardTask[];

      const existingIds = new Set(tasks.map((t) => t.id.toString()));
      const filteredNewTasks = newTasks.filter(
        (t) => !existingIds.has(t.id.toString()),
      );

      setTasks((prev) => [...prev, ...filteredNewTasks]);

      // Notify parent to append these tasks to the global board list
      if (onLoadMore && filteredNewTasks.length > 0) {
        onLoadMore(filteredNewTasks);
      }
    } catch (error) {
      console.error("Failed to load more tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col gap-3 min-w-[300px] max-w-[300px] w-[300px] bg-obsidian-night/50 rounded-lg p-2 h-full cmd-container relative transition-all duration-300 ${isLoading ? "shadow-[0_0_15px_rgba(var(--neon-pulse),0.3)] border border-neon-pulse" : "border border-white/5"}`}
    >
      <div
        className={`font-mono text-sm font-bold flex items-center justify-between pb-2 mb-1 border-b border-white/10 ${group.color} cmd-collapsible`}
      >
        <div className="flex items-center gap-2 px-1">
          <span>{group.title}</span>
          <FocusedLabel className="ml-2" />
        </div>
        <span className="bg-white/5 px-2 py-0.5 rounded text-syntax-grey text-xs">
          {totalCount ?? tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar flex-1 pb-4">
        {tasks.length === 0 ? (
          <div className="text-syntax-grey font-mono text-xs italic py-4 text-center border border-dashed border-white/10 rounded m-1 opacity-50">
            No tasks
          </div>
        ) : (
          tasks.map((task: MainBoardTask) => (
            <TaskCard
              key={task.id.toString()}
              task={task}
              isSelected={selectedTask?.id === task.id}
              onClick={() => onTaskClick(task.id.toString())}
              onContextMenu={(e) => onContextMenu(e, task)}
            />
          ))
        )}
        {hasMore && (
          <button
            onClick={loadMore}
            className="mt-2 py-2 px-4 rounded-md border border-white/10 text-syntax-grey font-mono text-xs hover:border-neon-pulse hover:text-neon-pulse transition-colors cmd-selectable [&.cmd-selected]:border-neon-pulse [&.cmd-selected]:text-neon-pulse [&.cmd-selected]:bg-neon-pulse/5 shrink-0"
          >
            [VIEW MORE]
          </button>
        )}
      </div>
    </div>
  );
}
