"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TaskDetailsPanel } from "./TaskDetailsPanel";
import { TaskCard } from "./TaskCard";
import { Search, ChevronDown, ChevronRight } from "lucide-react";
import { VoiceCallPanel } from "./VoiceCallPanel";
import { FocusedLabel } from "@/components/ui/FocusedLabel";
import { useCommand } from "@/context/CommandContext";
import type { MainBoardData, MainBoardTask, UnregisteredUser } from "./types";
import { useSocket } from "@/context/SocketContext";
import { WEBSOCKET_EVENTS } from "@syncoboard/shared";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSubMenu,
} from "@/components/ui/context-menu/ContextMenu";
import { SimpleConfirmationModal } from "@/components/modals/SimpleConfirmationModal";
import { ModifyTaskModal } from "@/components/modals/ModifyTaskModal";
import { useToast } from "@/context/ToastContext";
import axios from "axios";
import { useRef } from "react";

export function MainBoard({ board }: { board?: MainBoardData | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("taskId");
  const { isVoiceCallActive } = useCommand();
  const { socket, isConnected } = useSocket();

  const searchQueryParam = searchParams.get("search") || "";

  const [searchValue, setSearchValue] = useState(searchQueryParam);
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>(
    {},
  );
  const [collapsedGroups, setCollapsedGroups] = useState<
    Record<string, boolean>
  >({});

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    task: MainBoardTask | null;
  } | null>(null);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const moveMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals State
  const [modifyModalState, setModifyModalState] = useState<{
    isOpen: boolean;
    task: MainBoardTask | null;
  }>({ isOpen: false, task: null });

  const [simpleConfirmModalState, setSimpleConfirmModalState] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    message: "",
    onConfirm: async () => {},
  });

  const { setDeleteModalState } = useCommand();

  const handleContextMenu = (e: React.MouseEvent, task: MainBoardTask) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
    });
    setIsMoveMenuOpen(false);
    if (moveMenuTimeoutRef.current) {
      clearTimeout(moveMenuTimeoutRef.current);
    }
  };

  const handleMoveMenuMouseEnter = () => {
    if (moveMenuTimeoutRef.current) {
      clearTimeout(moveMenuTimeoutRef.current);
    }
    setIsMoveMenuOpen(true);
  };

  const handleMoveMenuMouseLeave = () => {
    moveMenuTimeoutRef.current = setTimeout(() => {
      setIsMoveMenuOpen(false);
    }, 300);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setIsMoveMenuOpen(false);
  };

  const handleModifyTask = async (newTitle: string) => {
    if (!modifyModalState.task) return;
    try {
      await axios.patch(`/api/tasks/${modifyModalState.task.id}`, {
        title: newTitle,
      });
      showToast("Task modified successfully", "success");
      setModifyModalState({ isOpen: false, task: null });
      router.refresh();
    } catch (error) {
      showToast("Failed to modify task", "error");
    }
  };

  const handleDeleteTask = async (task: MainBoardTask) => {
    try {
      await axios.delete(`/api/tasks/${task.id}`);
      showToast("Task deleted successfully", "success");
      setSimpleConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      router.refresh();
    } catch (error) {
      showToast("Failed to delete task", "error");
    }
  };

  const handleMoveTask = async (task: MainBoardTask, newStatus: string) => {
    try {
      await axios.patch(`/api/tasks/${task.id}`, { status: newStatus });
      showToast("Task moved successfully", "success");
      setSimpleConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      router.refresh();
    } catch (error) {
      showToast("Failed to move task", "error");
    }
  };

  const handleMoveOptionClick = (status: string) => {
    if (!contextMenu?.task) return;
    const taskToMove = contextMenu.task;
    closeContextMenu();
    setSimpleConfirmModalState({
      isOpen: true,
      message: `Are you sure you want to move task SYNC-${taskToMove.id} to ${status}?`,
      onConfirm: () => handleMoveTask(taskToMove, status),
    });
  };

  const ALL_STATUSES = [
    "TODO",
    "IN_PROGRESS",
    "IN_REVIEW",
    "CHANGES_REQUESTED",
    "DONE",
    "CLOSED",
  ];

  useEffect(() => {
    setSearchValue(searchQueryParam);
  }, [searchQueryParam]);

  // Socket.io integration for real-time updates
  useEffect(() => {
    if (!socket || !board?.id || !isConnected) return;

    // Join the board room
    socket.emit(WEBSOCKET_EVENTS.JOIN_BOARD, board.id);

    // Refresh the router when a relevant event happens
    const handleUpdate = () => {
      router.refresh();
    };

    socket.on(WEBSOCKET_EVENTS.TASK_UPDATED, handleUpdate);
    socket.on(WEBSOCKET_EVENTS.BOARD_UPDATED, handleUpdate);

    return () => {
      socket.emit(WEBSOCKET_EVENTS.LEAVE_BOARD, board.id);
      socket.off(WEBSOCKET_EVENTS.TASK_UPDATED, handleUpdate);
      socket.off(WEBSOCKET_EVENTS.BOARD_UPDATED, handleUpdate);
    };
  }, [socket, board?.id, isConnected, router]);

  const loadMore = (status: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [status]: (prev[status] || 5) + 5,
    }));
  };

  const toggleCollapse = (status: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);

    const params = new URLSearchParams(searchParams.toString());
    if (val.trim()) {
      params.set("search", val);
    } else {
      params.delete("search");
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  const tasks = useMemo(() => {
    if (!board?.tasks) return [];

    // Sort tasks by status to match the visual grouping
    const statusOrder: Record<string, number> = {
      TODO: 0,
      IN_PROGRESS: 1,
      IN_REVIEW: 2,
      CHANGES_REQUESTED: 3,
      DONE: 4,
      CLOSED: 5,
    };

    return [...board.tasks].sort((a: MainBoardTask, b: MainBoardTask) => {
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      // Secondary sort by updatedAt desc
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [board]);

  const selectedTask = useMemo(() => {
    if (!taskIdParam) return null;
    return (
      tasks.find((t: MainBoardTask) => t.id.toString() === taskIdParam) || null
    );
  }, [taskIdParam, tasks]);

  const statusGroups = [
    { title: "TODO", status: "TODO", color: "text-syntax-grey" },
    { title: "IN PROGRESS", status: "IN_PROGRESS", color: "text-neon-pulse" },
    { title: "IN REVIEW", status: "IN_REVIEW", color: "text-git-green" },
    {
      title: "CHANGES REQUESTED",
      status: "CHANGES_REQUESTED",
      color: "text-red-400",
    },
    { title: "DONE", status: "DONE", color: "text-git-green opacity-50" },
    { title: "CLOSED", status: "CLOSED", color: "text-syntax-grey opacity-50" },
  ];

  if (!board) {
    return (
      <div className="flex-1 flex items-center justify-center bg-obsidian-night transition-all cmd-container">
        <div className="text-syntax-grey font-mono text-sm">
          Select a board to view tasks
        </div>
        <span className="absolute top-4 right-4 text-neon-pulse font-mono text-xs opacity-0 [.cmd-active-container_&]:opacity-100 transition-opacity">
          focused
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      <div className="flex-1 flex flex-col bg-obsidian-night transition-all">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-mono font-bold"># {board.name}</h2>
        </div>

        <div className="flex-1 overflow-y-hidden p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-void-grey border border-white/10 rounded-md focus-within:border-git-green transition-colors">
            <Search size={16} className="text-syntax-grey" />
            <input
              type="text"
              placeholder="Search tasks... (or type /search-task)"
              value={searchValue}
              onChange={handleSearchChange}
              className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-syntax-grey/50"
            />
          </div>

          <div className="flex flex-col gap-4 h-full overflow-y-auto p-2 no-scrollbar">
            {tasks.length > 0 &&
              // This needs to be refactored by moving the task component into a separate file
              statusGroups.map((group) => {
                const groupTasks = tasks.filter(
                  (t: MainBoardTask) => t.status === group.status,
                );

                const visibleLimit = visibleCounts[group.status] || 5;
                const visibleTasks = groupTasks.slice(0, visibleLimit);
                const hasMore = groupTasks.length > visibleLimit;

                const isCollapsed = collapsedGroups[group.status] || false;

                return (
                  <div
                    key={group.status}
                    className="flex flex-col gap-3 cmd-container relative"
                  >
                    <div
                      className={`font-mono text-sm font-bold flex items-center justify-between border-b border-white/10 pb-2 cursor-pointer hover:opacity-80 transition-opacity cmd-collapsible ${group.color}`}
                      onClick={() => toggleCollapse(group.status)}
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight
                            size={16}
                            className="text-syntax-grey"
                          />
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
                                onClick={() =>
                                  router.push(`?taskId=${task.id.toString()}`)
                                }
                                onContextMenu={(e) =>
                                  handleContextMenu(e, task)
                                }
                              />
                            ))}

                            {hasMore && (
                              <button
                                onClick={() => loadMore(group.status)}
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
              })}
          </div>
          {tasks.length === 0 && (
            <div className="text-syntax-grey font-mono text-sm text-center py-10 italic cmd-container relative">
              <span className="opacity-0 [.cmd-active-container_&]:opacity-100 text-neon-pulse text-xs absolute top-2 right-2 transition-opacity">
                focused
              </span>
              No tasks found. Use /add-task to create one.
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailsPanel
          task={selectedTask}
          onClose={() => router.push(`/dashboard/b/${board.id}`)}
        />
      )}

      {isVoiceCallActive && board && <VoiceCallPanel boardId={board.id} />}

      {/* Context Menu */}
      {contextMenu && contextMenu.task && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={closeContextMenu}
        >
          <ContextMenuSubMenu
            label="Move Task"
            isOpen={isMoveMenuOpen}
            onMouseEnter={handleMoveMenuMouseEnter}
            onMouseLeave={handleMoveMenuMouseLeave}
          >
            {ALL_STATUSES.map((status) => (
              <ContextMenuItem
                key={status}
                onClick={() => handleMoveOptionClick(status)}
                disabled={contextMenu.task!.status === status}
              >
                {status}
              </ContextMenuItem>
            ))}
          </ContextMenuSubMenu>
          <ContextMenuItem
            onClick={() => {
              const task = contextMenu.task;
              closeContextMenu();
              if (task) {
                setModifyModalState({
                  isOpen: true,
                  task,
                });
              }
            }}
          >
            Modify Task
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-500 hover:text-red-400"
            onClick={() => {
              const task = contextMenu.task;
              closeContextMenu();
              if (task) {
                if (task.prNumber) {
                  setDeleteModalState({
                    isOpen: true,
                    message: `This task is attached to PR #${task.prNumber}. Are you absolutely sure you want to delete it?`,
                    onConfirm: () => handleDeleteTask(task),
                  });
                } else {
                  setSimpleConfirmModalState({
                    isOpen: true,
                    message: `Are you sure you want to delete task SYNC-${task.id}?`,
                    onConfirm: () => handleDeleteTask(task),
                  });
                }
              }
            }}
          >
            Delete Task
          </ContextMenuItem>
        </ContextMenu>
      )}

      {/* Modals */}
      <SimpleConfirmationModal
        isOpen={simpleConfirmModalState.isOpen}
        message={simpleConfirmModalState.message}
        onConfirm={simpleConfirmModalState.onConfirm}
        onCancel={() =>
          setSimpleConfirmModalState((prev) => ({ ...prev, isOpen: false }))
        }
      />

      {modifyModalState.task && (
        <ModifyTaskModal
          isOpen={modifyModalState.isOpen}
          initialTitle={modifyModalState.task.title}
          onConfirm={handleModifyTask}
          onCancel={() => setModifyModalState({ isOpen: false, task: null })}
        />
      )}
    </div>
  );
}
