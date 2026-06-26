"use client";

import React, { useState, useEffect } from "react";
import { boardApi } from "@syncoboard/api";

interface RemoveMemberModalProps {
  boardId: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  members: { user: { id: string, name: string | null; email: string | null } }[];
}

export function RemoveMemberModal({
  boardId,
  isOpen,
  onConfirm,
  onCancel,
  members,
}: RemoveMemberModalProps) {
  const [memberId, setMemberId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setMemberId(members[0]?.user.id || "");
      setError("");
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) return;

    setIsProcessing(true);
    setError("");

    try {
      await boardApi.removeMember(boardId, memberId);
      onConfirm();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to remove member.";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-obsidian-night border border-white/10 p-6 shadow-2xl max-w-md w-full cmd-container">
        <h3 className="text-xl font-mono text-white mb-4">Remove Member</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 text-sm font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full bg-void-grey border border-white/10 text-white font-mono p-2 focus:border-git-green focus:outline-none transition-colors cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-git-green/5"
              required
            >
              <option value="" disabled>Select a member...</option>
              {members.map(m => (
                 <option key={m.user.id} value={m.user.id}>{m.user.name || m.user.email}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isProcessing}
              className="px-4 py-2 text-syntax-grey font-mono text-sm hover:text-white transition-colors cmd-selectable [&.cmd-selected]:text-white [&.cmd-selected]:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!memberId || isProcessing}
              className="bg-red-500 text-white px-4 py-2 font-mono text-sm font-bold hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-obsidian-night"
            >
              {isProcessing ? "Removing..." : "Remove"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
