"use client";

import React, { useState } from "react";

interface SimpleConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  confirmText?: string;
}

export function SimpleConfirmationModal({
  isOpen,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
}: SimpleConfirmationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-void-grey border border-white/20 shadow-2xl p-6 max-w-md w-full cmd-container cmd-active-container">
        <h2 className="text-xl font-bold font-mono text-white mb-4">
          Confirm Action
        </h2>
        <p className="text-syntax-grey font-mono text-sm mb-6">{message}</p>

        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white font-mono py-2 transition-colors cmd-selectable [&.cmd-selected]:bg-white/20 [&.cmd-selected]:border [&.cmd-selected]:border-white"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`flex-1 font-mono font-bold py-2 transition-all cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white ${
              isProcessing
                ? "bg-git-green/50 text-white/50 cursor-not-allowed"
                : "bg-git-green hover:bg-git-green/80 text-obsidian-night"
            }`}
          >
            {isProcessing ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
