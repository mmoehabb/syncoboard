"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

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
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setCreatePr(false);
      setIsPreviewMode(false);
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
      <div className="bg-void-grey border border-white/20 shadow-2xl p-6 max-w-md w-full cmd-container cmd-active-container max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-bold font-mono text-white mb-4">
          Add Task
        </h2>

        <form
          onSubmit={handleConfirm}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="mb-4 shrink-0">
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

          <div className="mb-4 flex-1 flex flex-col min-h-[200px] shrink-0">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-syntax-grey font-mono text-xs">
                Description (Optional, Markdown supported)
              </label>
              <div className="flex bg-black/30 rounded border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(false)}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                    !isPreviewMode
                      ? "bg-white/10 text-white"
                      : "text-syntax-grey hover:text-white"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(true)}
                  className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                    isPreviewMode
                      ? "bg-white/10 text-white"
                      : "text-syntax-grey hover:text-white"
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {isPreviewMode ? (
              <div className="w-full h-full min-h-[150px] bg-black/50 border border-white/10 rounded px-3 py-2 text-white/80 font-mono text-sm overflow-y-auto prose prose-invert prose-sm max-w-none prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                {description ? (
                  <ReactMarkdown>{description}</ReactMarkdown>
                ) : (
                  <span className="italic text-syntax-grey">
                    Nothing to preview
                  </span>
                )}
              </div>
            ) : (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full h-full min-h-[150px] bg-black/50 border border-white/10 rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-neon-pulse focus:ring-1 focus:ring-neon-pulse transition-all cmd-selectable resize-none"
                placeholder="Enter task description using markdown..."
              />
            )}
          </div>

          <div className="mb-6 flex items-center gap-2 shrink-0">
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

          <div className="flex gap-4 shrink-0">
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
