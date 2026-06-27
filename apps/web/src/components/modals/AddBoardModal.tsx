"use client";

import React, { useState, useEffect } from "react";
import { githubApi, boardApi } from "@syncoboard/api";
import type { GithubRepo } from "@syncoboard/types";
import { useRouter } from "next/navigation";

interface AddBoardModalProps {
  workspaceId: string;
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AddBoardModal({
  workspaceId,
  isOpen,
  onConfirm,
  onCancel,
}: AddBoardModalProps) {
  const router = useRouter();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [boardName, setBoardName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setBoardName("");
      setSelectedRepo("");
      setError("");
      loadRepos();
    }
  }, [isOpen, workspaceId]);

  async function loadRepos() {
    setLoadingRepos(true);
    try {
      const fetchedRepos = await githubApi.getRepos(workspaceId);
      setRepos(fetchedRepos);
    } catch (err: unknown) {
      console.error(err);
      setError(
        "Failed to load GitHub repositories. Ensure your workspace has the GitHub App installed.",
      );
    } finally {
      setLoadingRepos(false);
    }
  }

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const repoDetails = repos.find((r) => r.name === selectedRepo);

      await boardApi.createBoard({
        workspaceId,
        name: boardName,
        repositoryName: repoDetails?.name || undefined,
        githubRepoId: repoDetails?.id ? String(repoDetails.id) : undefined,
      });
      onConfirm();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to create board.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-obsidian-night border border-white/10 p-6 shadow-2xl max-w-md w-full cmd-container">
        <h3 className="text-xl font-mono text-white mb-4">Add Board</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 text-sm font-mono">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-syntax-grey mb-2">
              Board Name
            </label>
            <input
              autoFocus
              type="text"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="e.g. Frontend Refactor"
              className="w-full bg-void-grey border border-white/10 text-white font-mono p-2 focus:border-git-green focus:outline-none transition-colors cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-git-green/5"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-mono text-syntax-grey mb-2">
              Link GitHub Repository
            </label>
            {loadingRepos ? (
              <div className="text-syntax-grey text-sm font-mono py-2">
                Loading repositories...
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select
                  value={selectedRepo}
                  onChange={(e) => setSelectedRepo(e.target.value)}
                  className="flex-1 min-w-0 bg-void-grey border border-white/10 text-white font-mono p-2 focus:border-git-green focus:outline-none transition-colors truncate cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-git-green/5"
                >
                  <option value="">-- No Repository --</option>
                  {repos.map((repo) => (
                    <option key={repo.id} value={repo.name}>
                      {repo.name} {repo.private ? "(Private)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="text-xs text-syntax-grey mt-2">
              Link a repository to enable code-first coordination. If your repo
              isn&apos;t listed, you may need to{" "}
              <a
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || "syncoboard"}/installations/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-git-green hover:underline"
              >
                grant access
              </a>
              .
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-syntax-grey font-mono text-sm hover:text-white transition-colors cmd-selectable [&.cmd-selected]:text-white [&.cmd-selected]:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!boardName.trim() || isSubmitting}
              className="bg-git-green text-obsidian-night px-4 py-2 font-mono text-sm font-bold hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-obsidian-night"
            >
              {isSubmitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
