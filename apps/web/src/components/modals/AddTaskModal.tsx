"use client";

import React, { useState, useEffect } from "react";

interface AddTaskModalProps {
  isOpen: boolean;
  initialStatus?: string;
  onConfirm: (
    title: string,
    description: string,
    createPr: boolean,
  ) => Promise<void> | void;
  onCancel: () => void;
}

export function AddTaskModal({
  isOpen,
  initialStatus,
  onConfirm,
  onCancel,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [createPr, setCreatePr] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setCreatePr(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || !title.trim()) return;
    setIsProcessing(true);
    try {
      await onConfirm(title.trim(), description.trim(), createPr);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-void-grey border border-white/20 shadow-2xl p-6 max-w-md w-full cmd-container cmd-active-container">
        <h2 className="text-xl font-bold font-mono text-white mb-4">
          Add Task
        </h2>

        <form onSubmit={handleConfirm}>
          <div className="mb-4">
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

          <div className="mb-4">
            <label className="block text-syntax-grey font-mono text-xs mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-neon-pulse focus:ring-1 focus:ring-neon-pulse transition-all cmd-selectable min-h-[100px]"
              placeholder="Enter task description..."
            />
          </div>

          <div className="mb-6 flex items-center gap-2">
            <input
              type="checkbox"
              id="createPrCheckbox"
              checked={createPr}
              onChange={(e) => setCreatePr(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-black/50 text-neon-pulse focus:ring-neon-pulse focus:ring-1"
            />
            <label
              htmlFor="createPrCheckbox"
              className="text-white/80 font-mono text-sm cursor-pointer"
            >
              Create Pull Request for this task
            </label>
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
              disabled={isProcessing || !title.trim()}
              className={`flex-1 font-mono font-bold py-2 transition-all cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white ${
                isProcessing || !title.trim()
                  ? "bg-git-green/20 text-white/50 cursor-not-allowed border border-git-green/30"
                  : "bg-git-green hover:bg-git-green/80 text-obsidian-night"
              }`}
            >
              {isProcessing ? "Adding..." : "Add Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
