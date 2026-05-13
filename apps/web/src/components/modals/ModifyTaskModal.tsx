"use client";

import React, { useState, useEffect } from "react";

interface ModifyTaskModalProps {
  isOpen: boolean;
  initialTitle: string;
  onConfirm: (newTitle: string) => Promise<void> | void;
  onCancel: () => void;
}

export function ModifyTaskModal({
  isOpen,
  initialTitle,
  onConfirm,
  onCancel,
}: ModifyTaskModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
    }
  }, [isOpen, initialTitle]);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !title.trim()) return;
    setIsProcessing(true);
    try {
      await onConfirm(title.trim());
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-void-grey border border-white/20 shadow-2xl p-6 max-w-md w-full cmd-container cmd-active-container">
        <h2 className="text-xl font-bold font-mono text-white mb-4">
          Modify Task
        </h2>

        <form onSubmit={handleConfirm}>
          <div className="mb-6">
            <label className="block text-syntax-grey font-mono text-xs mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-neon-pulse focus:ring-1 focus:ring-neon-pulse transition-all cmd-selectable"
              autoFocus
              placeholder="Enter task title..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-mono py-2 transition-colors cmd-selectable [&.cmd-selected]:bg-white/20 [&.cmd-selected]:border [&.cmd-selected]:border-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isProcessing || !title.trim() || title.trim() === initialTitle
              }
              className={`flex-1 font-mono font-bold py-2 transition-all cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white ${
                isProcessing || !title.trim() || title.trim() === initialTitle
                  ? "bg-git-green/20 text-white/50 cursor-not-allowed border border-git-green/30"
                  : "bg-git-green hover:bg-git-green/80 text-obsidian-night"
              }`}
            >
              {isProcessing ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
