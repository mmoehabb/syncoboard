"use client";

import { TaskCard } from "./TaskCard";
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
}

export function KanbanColumn({
  group,
  groupTasks,
  selectedTask,
  onTaskClick,
  onContextMenu,
}: KanbanColumnProps) {
  return (
    <div className="flex flex-col gap-3 min-w-[300px] max-w-[300px] w-[300px] bg-obsidian-night/50 rounded-lg p-2 border border-white/5 h-full cmd-container relative">
      <div
        className={`font-mono text-sm font-bold flex items-center justify-between pb-2 mb-1 border-b border-white/10 ${group.color} cmd-collapsible`}
      >
        <div className="flex items-center gap-2 px-1">
          <span>{group.title}</span>
          <FocusedLabel className="ml-2" />
        </div>
        <span className="bg-white/5 px-2 py-0.5 rounded text-syntax-grey text-xs">
          {groupTasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar flex-1 pb-4">
        {groupTasks.length === 0 ? (
          <div className="text-syntax-grey font-mono text-xs italic py-4 text-center border border-dashed border-white/10 rounded m-1 opacity-50">
            No tasks
          </div>
        ) : (
          groupTasks.map((task: MainBoardTask) => (
            <TaskCard
              key={task.id.toString()}
              task={task}
              isSelected={selectedTask?.id === task.id}
              onClick={() => onTaskClick(task.id.toString())}
              onContextMenu={(e) => onContextMenu(e, task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
