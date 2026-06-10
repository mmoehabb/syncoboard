"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { TaskDetailsPanel } from "./TaskDetailsPanel";
import { Search, LayoutList, Columns, AlignJustify } from "lucide-react";
import { VoiceCallPanel } from "./VoiceCallPanel";
import { TaskGroup } from "./TaskGroup";
import { KanbanColumn } from "./KanbanColumn";
import { useCommand } from "@/context/CommandContext";
import type { MainBoardData, MainBoardTask } from "./types";
import { useSocket } from "@/context/SocketContext";
import { WEBSOCKET_EVENTS } from "@syncoboard/shared";
import {
  TASK_STATUSES,
  TASK_STATUS_GROUPS,
  TASK_STATUS_ORDER,
} from "@syncoboard/types";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSubMenu,
} from "@/components/ui/context-menu/ContextMenu";
import { SimpleConfirmationModal } from "@/components/modals/SimpleConfirmationModal";
import { ModifyTaskModal } from "@/components/modals/ModifyTaskModal";
import { AddTaskModal } from "@/components/modals/AddTaskModal";
import { useToast } from "@/context/ToastContext";
import axios from "axios";
import { useRef } from "react";

import type { TaskCounts, AvailableMember } from "./types";
import { Filter, Calendar } from "lucide-react";

export function MainBoard({
  board,
  taskCounts,
  boardId,
  searchQuery,
  availableMembers,
  initialLimit,
}: {
  board?: MainBoardData | null;
  taskCounts?: TaskCounts;
  boardId?: string;
  searchQuery?: string;
  availableMembers?: AvailableMember[];
  initialLimit?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const taskIdParam = searchParams.get("taskId");
  const { isVoiceCallActive } = useCommand();
  const { socket, isConnected } = useSocket();

  const searchQueryParam = searchParams.get("search") || "";

  const [searchValue, setSearchValue] = useState(searchQueryParam);
  const [layout, setLayout] = useState<"list" | "kanban" | "rows">("list");

  useEffect(() => {
    const savedLayout = localStorage.getItem("boardLayout");
    if (
      savedLayout === "list" ||
      savedLayout === "kanban" ||
      savedLayout === "rows"
    ) {
      setLayout(savedLayout);
    }
  }, []);

  const handleLayoutChange = (newLayout: "list" | "kanban" | "rows") => {
    setLayout(newLayout);
    localStorage.setItem("boardLayout", newLayout);
  };

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    task: MainBoardTask | null;
  } | null>(null);
  const [isMoveMenuOpen, setIsMoveMenuOpen] = useState(false);
  const moveMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modals State
  const [modifyModalState, setModifyModalState] = useState<{
    isOpen: boolean;
    task: MainBoardTask | null;
  }>({ isOpen: false, task: null });

  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

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

  const handleAddTask = async (title: string) => {
    if (!board) return;
    try {
      await axios.post("/api/tasks", {
        boardId: board.id,
        title,
      });
      showToast("Task added successfully", "success");
      setIsAddTaskModalOpen(false);
      router.refresh();
    } catch (error) {
      showToast("Failed to add task", "error");
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

  const handleKanbanScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    if (layout !== "kanban" || !scrollContainerRef.current) return;

    // Only scroll horizontally if there is no vertical scrolling happening inside a column
    // We check if the event target is a column's scrollable area
    const target = e.target as HTMLElement;
    const isColumnScrollable = target.closest(".overflow-y-auto");

    if (isColumnScrollable) {
      // If the target is scrollable vertically and we are scrolling vertically, let it scroll
      const isScrollingVertically = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      if (isScrollingVertically) return;
    }

    // Convert vertical scroll to horizontal scroll
    scrollContainerRef.current.scrollLeft += e.deltaY;
  };

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const assigneeParam = searchParams.get("assignee") || "";
  const reviewerParam = searchParams.get("reviewer") || "";
  const startDateParam = searchParams.get("startDate") || "";
  const endDateParam = searchParams.get("endDate") || "";
  const limitParam = searchParams.get("limit") || "5";

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
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

  const [paginatedTasks, setPaginatedTasks] = useState<MainBoardTask[]>([]);

  // Clear paginated tasks if the filters or board changes
  useEffect(() => {
    setPaginatedTasks([]);
  }, [
    searchQuery,
    assigneeParam,
    reviewerParam,
    startDateParam,
    endDateParam,
    limitParam,
    board?.id,
  ]);

  const tasks = useMemo(() => {
    if (!board?.tasks && paginatedTasks.length === 0) return [];

    // Combine server-provided tasks with our locally fetched paginated ones
    const combinedMap = new Map();
    if (board?.tasks) {
      board.tasks.forEach((t) => combinedMap.set(t.id.toString(), t));
    }

    paginatedTasks.forEach((t) => {
      // Don't overwrite newer server tasks with older paginated ones
      if (!combinedMap.has(t.id.toString())) {
        combinedMap.set(t.id.toString(), t);
      }
    });

    const combinedTasks = Array.from(combinedMap.values());

    // Sort tasks by status to match the visual grouping
    return combinedTasks.sort((a: MainBoardTask, b: MainBoardTask) => {
      const orderA = TASK_STATUS_ORDER[a.status] ?? 99;
      const orderB = TASK_STATUS_ORDER[b.status] ?? 99;
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

  if (!board) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-obsidian-night transition-all cmd-container gap-4">
        <div className="text-syntax-grey font-mono text-sm">
          Select a board to view tasks
        </div>
        <button
          onClick={() => router.push("/settings")}
          className="border border-neon-pulse text-neon-pulse font-bold font-mono py-2 px-4 hover:bg-neon-pulse hover:text-obsidian-night transition-colors rounded"
        >
          Add Board
        </button>
        <span className="absolute top-4 right-4 text-neon-pulse font-mono text-xs opacity-0 [.cmd-active-container_&]:opacity-100 transition-opacity">
          focused
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden h-full">
      <div className="flex-1 flex flex-col bg-obsidian-night transition-all min-w-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-white font-mono font-bold"># {board.name}</h2>
            <div className="flex items-center gap-1 bg-void-grey border border-white/10 rounded px-1 py-1">
              <button
                onClick={() => handleLayoutChange("list")}
                className={`p-1 rounded transition-colors ${layout === "list" ? "bg-white/10 text-white" : "text-syntax-grey hover:text-white"}`}
                title="List Layout"
              >
                <LayoutList size={16} />
              </button>
              <button
                onClick={() => handleLayoutChange("kanban")}
                className={`p-1 rounded transition-colors ${layout === "kanban" ? "bg-white/10 text-white" : "text-syntax-grey hover:text-white"}`}
                title="Kanban Layout"
              >
                <Columns size={16} />
              </button>
              <button
                onClick={() => handleLayoutChange("rows")}
                className={`p-1 rounded transition-colors ${layout === "rows" ? "bg-white/10 text-white" : "text-syntax-grey hover:text-white"}`}
                title="Rows Layout"
              >
                <AlignJustify size={16} />
              </button>
            </div>
          </div>
          <button
            onClick={() => setIsAddTaskModalOpen(true)}
            className="text-syntax-grey hover:text-neon-pulse text-sm font-mono transition-colors border border-syntax-grey/30 hover:border-neon-pulse/50 rounded px-3 py-1 bg-void-grey"
          >
            + add task
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-void-grey border border-white/10 rounded-md focus-within:border-git-green transition-colors">
              <Search size={16} className="text-syntax-grey" />
              <input
                type="text"
                placeholder="Search tasks... (or type /search-task)"
                value={searchValue}
                onChange={handleSearchChange}
                className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-white placeholder:text-syntax-grey/50"
              />
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className={`p-1.5 rounded transition-colors ${isFiltersOpen || assigneeParam || reviewerParam || startDateParam || endDateParam || limitParam !== "5" ? "bg-neon-pulse/20 text-neon-pulse" : "text-syntax-grey hover:bg-white/5 hover:text-white"}`}
                title="Advanced Filters"
              >
                <Filter size={16} />
              </button>
            </div>

            {isFiltersOpen && (
              <div className="bg-void-grey border border-white/10 rounded-md p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-syntax-grey font-mono uppercase tracking-wider">
                    Assignee
                  </label>
                  <select
                    value={assigneeParam}
                    onChange={(e) =>
                      handleFilterChange("assignee", e.target.value)
                    }
                    className="bg-obsidian-night border border-white/10 rounded px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-neon-pulse appearance-none"
                  >
                    <option value="">Any</option>
                    {availableMembers?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email || m.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-syntax-grey font-mono uppercase tracking-wider">
                    Reviewer
                  </label>
                  <select
                    value={reviewerParam}
                    onChange={(e) =>
                      handleFilterChange("reviewer", e.target.value)
                    }
                    className="bg-obsidian-night border border-white/10 rounded px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-neon-pulse appearance-none"
                  >
                    <option value="">Any</option>
                    {availableMembers?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.email || m.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-syntax-grey font-mono uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={10} /> Start Date
                  </label>
                  <input
                    type="date"
                    value={startDateParam}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="bg-obsidian-night border border-white/10 rounded px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-neon-pulse"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-syntax-grey font-mono uppercase tracking-wider flex items-center gap-1">
                    <Calendar size={10} /> End Date
                  </label>
                  <input
                    type="date"
                    value={endDateParam}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="bg-obsidian-night border border-white/10 rounded px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-neon-pulse"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-syntax-grey font-mono uppercase tracking-wider">
                    Limit Per Column
                  </label>
                  <select
                    value={limitParam}
                    onChange={(e) =>
                      handleFilterChange("limit", e.target.value)
                    }
                    className="bg-obsidian-night border border-white/10 rounded px-2 py-1.5 text-sm text-white font-mono outline-none focus:border-neon-pulse appearance-none"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="-1">All</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div
            ref={scrollContainerRef}
            onWheel={handleKanbanScroll}
            className={`flex ${layout === "kanban" ? "flex-row overflow-x-auto h-full gap-4 pb-4" : "flex-col gap-4 h-full overflow-y-auto p-2 no-scrollbar"}`}
          >
            {tasks.length > 0 &&
              TASK_STATUS_GROUPS.map((group) => {
                const groupTasks = tasks.filter(
                  (t: MainBoardTask) => t.status === group.status,
                );

                const currentLimit =
                  initialLimit === -1 ? undefined : initialLimit || 5;
                const limitCount = taskCounts
                  ? taskCounts[group.status]
                  : groupTasks.length;

                if (layout === "kanban") {
                  return (
                    <KanbanColumn
                      key={group.status}
                      group={group}
                      groupTasks={groupTasks}
                      selectedTask={selectedTask}
                      onTaskClick={(taskId) => router.push(`?taskId=${taskId}`)}
                      onContextMenu={handleContextMenu}
                      totalCount={limitCount}
                      boardId={boardId}
                      searchQuery={searchQuery}
                      assignee={assigneeParam || undefined}
                      reviewer={reviewerParam || undefined}
                      startDate={startDateParam || undefined}
                      endDate={endDateParam || undefined}
                      take={currentLimit}
                      onLoadMore={(newTasks) =>
                        setPaginatedTasks((prev) => [...prev, ...newTasks])
                      }
                    />
                  );
                }

                return (
                  <TaskGroup
                    key={group.status}
                    group={group}
                    groupTasks={groupTasks}
                    selectedTask={selectedTask}
                    onTaskClick={(taskId) => router.push(`?taskId=${taskId}`)}
                    onContextMenu={handleContextMenu}
                    layout={layout}
                    totalCount={limitCount}
                    boardId={boardId}
                    searchQuery={searchQuery}
                    assignee={assigneeParam || undefined}
                    reviewer={reviewerParam || undefined}
                    startDate={startDateParam || undefined}
                    endDate={endDateParam || undefined}
                    take={currentLimit}
                    onLoadMore={(newTasks) =>
                      setPaginatedTasks((prev) => [...prev, ...newTasks])
                    }
                  />
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
          repositoryName={board?.repositoryName}
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
            {TASK_STATUSES.map((status) => (
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

      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        onConfirm={handleAddTask}
        onCancel={() => setIsAddTaskModalOpen(false)}
      />
    </div>
  );
}
