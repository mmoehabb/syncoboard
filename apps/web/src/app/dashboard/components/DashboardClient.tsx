"use client";

import { ReactNode, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MainBoard } from "./MainBoard";
import type {
  DashboardWorkspace,
  MainBoardData,
  TaskCounts,
  AvailableMember,
} from "./types";
import { useState } from "react";
import { SocketProvider } from "@/context/SocketContext";
import { UserApi } from "@syncoboard/api";

export function DashboardClient({
  workspaces,
  hasActiveSubscription,
  modalComponent,
  board,
  taskCounts,
  boardId,
  searchQuery,
  availableMembers,
  initialLimit,
}: {
  workspaces: DashboardWorkspace[];
  hasActiveSubscription: boolean;
  modalComponent: ReactNode;
  board?: MainBoardData | null;
  taskCounts?: TaskCounts;
  boardId?: string;
  searchQuery?: string;
  availableMembers?: AvailableMember[];
  initialLimit?: number;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (board?.id) {
      document.cookie = `lastSelectedBoardId=${board.id}; path=/; max-age=31536000`; // 1 year
    }
  }, [board?.id]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const storedDate = sessionStorage.getItem("lastOnlineDate");

    if (storedDate !== today) {
      const api = new UserApi();
      api
        .updateLastOnline()
        .then(() => {
          sessionStorage.setItem("lastOnlineDate", today);
        })
        .catch((err) => {
          console.error("Failed to update last online activity", err);
        });
    }
  }, []);

  return (
    <SocketProvider>
      <div className="w-full h-screen flex flex-col bg-obsidian-night overflow-hidden">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex-1 flex overflow-hidden relative">
          <Sidebar
            workspaces={workspaces}
            activeBoardId={board?.id}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
          <MainBoard
            board={board}
            taskCounts={taskCounts}
            boardId={boardId}
            searchQuery={searchQuery}
            availableMembers={availableMembers}
            initialLimit={initialLimit}
          />
          {!hasActiveSubscription && modalComponent}
        </div>
      </div>
    </SocketProvider>
  );
}
