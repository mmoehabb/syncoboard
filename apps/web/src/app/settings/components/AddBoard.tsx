"use client";

import { useEffect, useState } from "react";
import { githubApi } from "@syncoboard/api";
import type { GithubRepo } from "@syncoboard/types";
import { boardApi } from "@syncoboard/api";
import { useRouter } from "next/navigation";

interface AddBoardProps {
  workspaces: { id: string; name: string }[];
}

export function AddBoard({ workspaces }: AddBoardProps) {
  const router = useRouter();
  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState(
    workspaces[0]?.id || "",
  );
  const [selectedRepo, setSelectedRepo] = useState("");
  const [boardName, setBoardName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRepos() {
      if (!selectedWorkspace) return;

      setLoadingRepos(true);
      try {
        const fetchedRepos = await githubApi.getRepos(selectedWorkspace);
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
    loadRepos();
  }, [selectedWorkspace]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !boardName) {
      setError("Workspace and Board Name are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const repoDetails = repos.find((r) => r.name === selectedRepo);

      await boardApi.createBoard({
        workspaceId: selectedWorkspace,
        name: boardName,
        repositoryName: repoDetails?.name || undefined,
        githubRepoId: repoDetails?.id ? String(repoDetails.id) : undefined,
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        ((err && typeof err === "object" && "response" in err ? err.response : {}) /* @ts-expect-error override */ ).response?.data
          ?.error || "Failed to create board.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto border border-white/10 bg-void-grey p-6 shadow-xl">
      <h2 className="text-xl font-bold font-mono text-white mb-6">
        Add New Board
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 text-sm font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-mono text-syntax-grey mb-2">
            Workspace
          </label>
          <select
            value={selectedWorkspace}
            onChange={(e) => setSelectedWorkspace(e.target.value)}
            className="w-full bg-obsidian-night border border-white/10 text-white font-mono p-2 focus:border-git-green focus:outline-none transition-colors cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-git-green/5"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-mono text-syntax-grey mb-2">
            Board Name
          </label>
          <input
            type="text"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="e.g. Frontend Refactor"
            className="w-full bg-obsidian-night border border-white/10 text-white font-mono p-2 focus:border-git-green focus:outline-none transition-colors cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-git-green/5"
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
                className="flex-1 min-w-0 bg-obsidian-night border border-white/10 text-white font-mono p-2 focus:border-git-green focus:outline-none transition-colors truncate cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-git-green/5"
              >
                <option value="">-- No Repository --</option>
                {repos.map((repo) => (
                  <option key={repo.id} value={repo.name}>
                    {repo.name} {repo.private ? "(Private)" : ""}
                  </option>
                ))}
              </select>
              <a
                href={`https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME || "syncoboard"}/installations/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-white/5 border border-white/10 text-white font-mono text-sm hover:bg-white/10 hover:border-git-green transition-colors whitespace-nowrap text-center sm:text-left cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-white/10"
              >
                Grant Access
              </a>
            </div>
          )}
          <p className="text-xs text-syntax-grey mt-2">
            Link a repository to enable code-first coordination. If your repo
            isn&apos;t listed, you may need to grant access.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-git-green text-obsidian-night font-bold font-mono py-2 hover:bg-opacity-90 transition-opacity disabled:opacity-50 cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
        >
          {isSubmitting ? "Creating..." : "Create Board"}
        </button>
      </form>
    </div>
  );
}
