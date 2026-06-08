import { useState, useEffect } from "react";
import { getMoreTasks } from "../taskActions";
import type { TaskStatus } from "@syncoboard/db";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FocusedLabel } from "@/components/ui/FocusedLabel";
import { TaskCard } from "./TaskCard";
import { TaskRow } from "./TaskRow";
import type { MainBoardTask } from "./types";

interface TaskGroupProps {
  group: {
    title: string;
    status: string;
    color: string;
  };
  groupTasks: MainBoardTask[];
  selectedTask: MainBoardTask | null;
  onTaskClick: (taskId: string) => void;
  onContextMenu: (e: React.MouseEvent, task: MainBoardTask) => void;
  layout?: "list" | "rows" | "kanban";
  totalCount?: number;
  boardId?: string;
  searchQuery?: string;
  onLoadMore?: (tasks: MainBoardTask[]) => void;
}

export function TaskGroup({
  group,
  groupTasks,
  selectedTask,
  onTaskClick,
  onContextMenu,
  layout = "list",
  totalCount,
  boardId,
  searchQuery,
  onLoadMore,
}: TaskGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tasks, setTasks] = useState<MainBoardTask[]>(groupTasks);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = totalCount !== undefined ? tasks.length < totalCount : false;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

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
      // The newTasks come back as serialized bigints. They should match MainBoardTask type loosely for rendering.
      const newTasks = newTasksRaw as unknown as MainBoardTask[];

      // Filter out any duplicates just in case (e.g. if something was added while paginating)
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
      className={`flex flex-col gap-3 cmd-container relative transition-all duration-300 ${isLoading ? "shadow-[0_0_15px_rgba(var(--neon-pulse),0.3)] border border-neon-pulse rounded-lg p-2" : "border border-transparent"}`}
    >
      <div
        className={`font-mono text-sm font-bold flex items-center justify-between border-b border-white/10 pb-2 cursor-pointer hover:opacity-80 transition-opacity cmd-collapsible ${group.color}`}
        onClick={toggleCollapse}
      >
        <div className="flex items-center gap-2">
          {isCollapsed ? (
            <ChevronRight size={16} className="text-syntax-grey" />
          ) : (
            <ChevronDown size={16} className="text-syntax-grey" />
          )}
          <span>{group.title}</span>
          <FocusedLabel className="ml-2" />
        </div>
        <span className="bg-white/5 px-2 py-0.5 rounded text-syntax-grey text-xs">
          {totalCount ?? tasks.length}
        </span>
      </div>
      {!isCollapsed && (
        <>
          {tasks.length === 0 ? (
            <div className="text-syntax-grey font-mono text-sm italic py-2 text-center border border-dashed border-white/10 rounded">
              No tasks in this status
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map((task: MainBoardTask) =>
                layout === "rows" ? (
                  <TaskRow
                    key={task.id.toString()}
                    task={task}
                    isSelected={selectedTask?.id === task.id}
                    onClick={() => onTaskClick(task.id.toString())}
                    onContextMenu={(e) => onContextMenu(e, task)}
                  />
                ) : (
                  <TaskCard
                    key={task.id.toString()}
                    task={task}
                    isSelected={selectedTask?.id === task.id}
                    onClick={() => onTaskClick(task.id.toString())}
                    onContextMenu={(e) => onContextMenu(e, task)}
                  />
                ),
              )}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="mt-2 py-2 px-4 rounded-md border border-white/10 text-syntax-grey font-mono text-xs hover:border-neon-pulse hover:text-neon-pulse transition-colors cmd-selectable [&.cmd-selected]:border-neon-pulse [&.cmd-selected]:text-neon-pulse [&.cmd-selected]:bg-neon-pulse/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin border-2 border-syntax-grey border-t-neon-pulse rounded-full w-3 h-3 inline-block" />
                      LOADING
                    </span>
                  ) : (
                    "[VIEW MORE]"
                  )}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
