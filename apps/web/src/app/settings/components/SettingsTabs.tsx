"use client";

import { useState } from "react";
import { AddBoard } from "./AddBoard";
import { AccountSettings } from "./AccountSettings";
import { FocusedLabel } from "@/components/ui/FocusedLabel";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface SettingsTabsProps {
  workspaces: { id: string; name: string }[];
  userId: string;
  isActive: boolean;
  subscription: any;
}

export function SettingsTabs({
  workspaces,
  userId,
  isActive,
  subscription,
}: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<"add-board" | "account">(
    "add-board",
  );

  return (
    <>
      {/* Left Nav */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/10 bg-void-grey/50 p-4 md:p-6 flex flex-col gap-4 cmd-container relative shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="p-1 rounded hover:bg-white/10 text-syntax-grey hover:text-white transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </Link>
            <h3 className="text-syntax-grey font-bold uppercase tracking-wider text-xs">
              Settings
            </h3>
          </div>
          <FocusedLabel />
        </div>
        <div className="flex flex-row md:flex-col gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab("add-board")}
            className={`whitespace-nowrap md:w-full text-center md:text-left px-3 py-2 border-b-2 md:border-b-0 md:border-l-2 text-sm transition-colors cmd-selectable ${
              activeTab === "add-board"
                ? "bg-white/10 border-git-green text-white"
                : "border-transparent text-syntax-grey hover:bg-white/5 hover:text-white"
            } [&.cmd-selected]:bg-white/10 [&.cmd-selected]:text-white`}
          >
            Add Board
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`whitespace-nowrap md:w-full text-center md:text-left px-3 py-2 border-b-2 md:border-b-0 md:border-l-2 text-sm transition-colors cmd-selectable ${
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
      <div className="flex-1 p-4 sm:p-8 overflow-y-auto cmd-container relative">
        <div className="hidden md:flex justify-end mb-4">
          <FocusedLabel />
        </div>
        {activeTab === "add-board" && <AddBoard workspaces={workspaces} />}
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
