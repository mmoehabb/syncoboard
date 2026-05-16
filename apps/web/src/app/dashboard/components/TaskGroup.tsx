import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { FocusedLabel } from "@/components/ui/FocusedLabel";
import { TaskCard } from "./TaskCard";
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
}

export function TaskGroup({
  group,
  groupTasks,
  selectedTask,
  onTaskClick,
  onContextMenu,
}: TaskGroupProps) {
  const [visibleLimit, setVisibleLimit] = useState(5);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const visibleTasks = groupTasks.slice(0, visibleLimit);
  const hasMore = groupTasks.length > visibleLimit;

  const toggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const loadMore = () => {
    setVisibleLimit((prev) => prev + 5);
  };

  return (
    <div className="flex flex-col gap-3 cmd-container relative">
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
          {groupTasks.length}
        </span>
      </div>
      {!isCollapsed && (
        <>
          {groupTasks.length === 0 ? (
            <div className="text-syntax-grey font-mono text-sm italic py-2 text-center border border-dashed border-white/10 rounded">
              No tasks in this status
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {visibleTasks.map((task: MainBoardTask) => (
                <TaskCard
                  key={task.id.toString()}
                  task={task}
                  isSelected={selectedTask?.id === task.id}
                  onClick={() => onTaskClick(task.id.toString())}
                  onContextMenu={(e) => onContextMenu(e, task)}
                />
              ))}

              {hasMore && (
                <button
                  onClick={loadMore}
                  className="mt-2 py-2 px-4 rounded-md border border-white/10 text-syntax-grey font-mono text-xs hover:border-neon-pulse hover:text-neon-pulse transition-colors cmd-selectable [&.cmd-selected]:border-neon-pulse [&.cmd-selected]:text-neon-pulse [&.cmd-selected]:bg-neon-pulse/5"
                >
                  [VIEW MORE]
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
