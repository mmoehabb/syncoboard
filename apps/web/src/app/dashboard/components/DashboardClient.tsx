"use client";

import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MainBoard } from "./MainBoard";
import type { DashboardWorkspace, MainBoardData } from "./types";
import { useState } from "react";
import { SocketProvider } from "@/context/SocketContext";

export function DashboardClient({
  workspaces,
  hasActiveSubscription,
  modalComponent,
  board,
}: {
  workspaces: DashboardWorkspace[];
  hasActiveSubscription: boolean;
  modalComponent: ReactNode;
  board?: MainBoardData | null;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
          <MainBoard board={board} />
          {!hasActiveSubscription && modalComponent}
        </div>
      </div>
    </SocketProvider>
  );
}
