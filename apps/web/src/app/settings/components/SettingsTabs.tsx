"use client";

import { useState } from "react";
import { AddBoard } from "./AddBoard";
import { AccountSettings } from "./AccountSettings";
import { FocusedLabel } from "@/components/ui/FocusedLabel";
import { AddWorkspace } from "./AddWorkspace";

interface SettingsTabsProps {
  workspaces: { id: string; name: string }[];
  userId: string;
  isActive: boolean;
  subscription: unknown;
}

export function SettingsTabs({
  workspaces,
  userId,
  isActive,
  subscription,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<
    "add-board" | "account" | "add-workspace"
  >("add-board");

  return (
    <>
      {/* Left Nav */}
      <div className="w-64 border-r border-white/10 bg-void-grey/50 p-6 flex flex-col gap-4 cmd-container relative">
        <div className="flex items-center justify-between">
          <h3 className="text-syntax-grey font-bold uppercase tracking-wider text-xs">
            Settings
          </h3>
          <FocusedLabel />
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("add-board")}
            className={`text-left px-3 py-2 border-l-2 text-sm transition-colors cmd-selectable ${
              activeTab === "add-board"
                ? "bg-white/10 border-git-green text-white"
                : "border-transparent text-syntax-grey hover:bg-white/5 hover:text-white"
            } [&.cmd-selected]:bg-white/10 [&.cmd-selected]:text-white`}
          >
            Add Board
          </button>
          <button
            onClick={() => setActiveTab("add-workspace")}
            className={`text-left px-3 py-2 border-l-2 text-sm transition-colors cmd-selectable ${
              activeTab === "add-workspace"
                ? "bg-white/10 border-git-green text-white"
                : "border-transparent text-syntax-grey hover:bg-white/5 hover:text-white"
            } [&.cmd-selected]:bg-white/10 [&.cmd-selected]:text-white`}
          >
            Add Workspace
          </button>
          <button
            onClick={() => setActiveTab("account")}
            className={`text-left px-3 py-2 border-l-2 text-sm transition-colors cmd-selectable ${
              activeTab === "account"
                ? "bg-white/10 border-git-green text-white"
                : "border-transparent text-syntax-grey hover:bg-white/5 hover:text-white"
            } [&.cmd-selected]:bg-white/10 [&.cmd-selected]:text-white`}
          >
            Account Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto cmd-container relative">
        <div className="flex justify-end mb-4">
          <FocusedLabel />
        </div>
        {activeTab === "add-board" && <AddBoard workspaces={workspaces} />}
        {activeTab === "add-workspace" && <AddWorkspace />}
        {activeTab === "account" && (
          <AccountSettings
            userId={userId}
            isActive={isActive}
            subscription={subscription}
          />
        )}
      </div>
    </>
  );
}
