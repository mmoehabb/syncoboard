"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useRef,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "./ToastContext";
import { AppMode } from "../types/commands";
import { COMMAND_REGISTRY } from "../lib/command-registry";
import {
  useInputFocusTracking,
  useActiveContainerSync,
  useKeyboardNavigation,
} from "../hooks/command";

import { useEffect } from "react";

interface CommandContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  outputHistory: string[];
  executeCommand: (commandStr: string) => void;
  printOutput: (output: string[]) => void;
  clearHistory: () => void;

  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  isVoiceCallActive: boolean;
  setIsVoiceCallActive: (active: boolean) => void;

  commandLog: string[];
  virtualPath: string;
  setVirtualPath: (path: string) => void;

  deleteModalState: {
    isOpen: boolean;
    message?: string;
    onConfirm?: () => Promise<void>;
  };
  setDeleteModalState: (state: {
    isOpen: boolean;
    message?: string;
    onConfirm?: () => Promise<void>;
  }) => void;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export function CommandProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("normal");
  const [outputHistory, setOutputHistory] = useState<string[]>([]);
  const [commandLog, setCommandLog] = useState<string[]>([]);
  const [virtualPath, setVirtualPath] = useState<string>("/");
  const router = useRouter();
  const { showToast } = useToast();
  const params = useParams();

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    message?: string;
    onConfirm?: () => Promise<void>;
  }>({ isOpen: false });

  const { isInputFocused } = useInputFocusTracking();
  useActiveContainerSync();
  useKeyboardNavigation(mode, setMode);

  // Load command log and virtual path from local storage on mount
  const isLoaded = useRef(false);
  useEffect(() => {
    if (isLoaded.current) return;
    try {
      const storedLog = localStorage.getItem("syncoboard_command_log");
      if (storedLog) {
        setTimeout(() => setCommandLog(JSON.parse(storedLog)), 0);
      }
      const storedPath = localStorage.getItem("syncoboard_virtual_path");
      if (storedPath) {
        setTimeout(() => setVirtualPath(storedPath), 0);
      }
      isLoaded.current = true;
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
  }, []);

  // Save virtual path to local storage when it changes
  useEffect(() => {
    localStorage.setItem("syncoboard_virtual_path", virtualPath);
  }, [virtualPath]);

  const clearHistory = () => setOutputHistory([]);

  const printOutput = (output: string[]) => {
    if (output.length === 0) {
      clearHistory();
    } else {
      setOutputHistory((prev) => [...prev, ...output]);
    }
  };

  const executeCommand = (commandStr: string) => {
    const trimmedCommand = commandStr.trim();
    if (!trimmedCommand) return;

    // Update command log
    setCommandLog((prev) => {
      const newLog = [
        trimmedCommand,
        ...prev.filter((c) => c !== trimmedCommand),
      ].slice(0, 10);
      localStorage.setItem("syncoboard_command_log", JSON.stringify(newLog));
      return newLog;
    });

    const parts = trimmedCommand.split(" ");
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    printOutput([`$ /${trimmedCommand}`]);

    if (COMMAND_REGISTRY[cmdName]) {
      COMMAND_REGISTRY[cmdName].action({
        navigate: (path) => router.push(path),
        printOutput,
        setMode,
        args,
        selectedTaskId,
        activeBoardId: params?.boardId | undefined,
        isVoiceCallActive,
        setIsVoiceCallActive,
        virtualPath,
        setVirtualPath,
        setDeleteModalState,
        showToast,
      });
    } else {
      printOutput([
        `Command not found: ${cmdName}. Type /help for available commands.`,
      ]);
    }
  };

  return (
    <CommandContext.Provider
      value={{
        mode,
        setMode,
        outputHistory,
        executeCommand,
        printOutput,
        clearHistory,
        selectedTaskId,
        setSelectedTaskId,
        isVoiceCallActive,
        setIsVoiceCallActive,
        commandLog,
        virtualPath,
        setVirtualPath,
        deleteModalState,
        setDeleteModalState,
      }}
    >
      {children}
      {isInputFocused && mode === "normal" && (
        <div className="fixed bottom-4 left-4 z-50 bg-git-green text-obsidian-night font-mono text-xs px-3 py-2 rounded shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
          Press{" "}
          <kbd className="font-bold border border-obsidian-night/20 rounded px-1">
            ESC
          </kbd>{" "}
          to resume navigation
        </div>
      )}
    </CommandContext.Provider>
  );
}

export function useCommand() {
  const context = useContext(CommandContext);
  if (context === undefined) {
    throw new Error("useCommand must be used within a CommandProvider");
  }
  return context;
}
