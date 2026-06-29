"use client";

import { useEffect, useState } from "react";
import { githubApi } from "@syncoboard/api";
import type { GithubRepo } from "@syncoboard/types";
import { boardApi } from "@syncoboard/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { getUserBoards } from "../memberActions";

interface BoardManagementProps {
  workspaces: { id: string; name: string }[];
  userId: string;
}

export function BoardManagement({ workspaces, userId }: BoardManagementProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [repos, setRepos] = useState<GithubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState(
    workspaces[0]?.id || "",
  );
  const [selectedRepo, setSelectedRepo] = useState("");
  const [boardName, setBoardName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [userBoards, setUserBoards] = useState<
    { id: string; name: string; workspaceName: string; role: string }[]
  >([]);
  const [loadingBoards, setLoadingBoards] = useState(true);

  const fetchBoards = async () => {
    try {
      setLoadingBoards(true);
      const boards = await getUserBoards(userId);
      setUserBoards(boards);
    } catch (e: any) {
      console.error(e);
      showToast("Failed to load user boards.", "error");
    } finally {
      setLoadingBoards(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [userId]);

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

      showToast("Board created successfully", "success");
      setBoardName("");
      setSelectedRepo("");
      fetchBoards();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to create board.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveBoard = async (workspaceName: string, boardName: string) => {
    if (confirm(`Are you sure you want to leave ${boardName}?`)) {
      try {
        await boardApi.leaveBoard(workspaceName, boardName);
        showToast("Successfully left board", "success");
        fetchBoards();
      } catch (e: any) {
        showToast(e?.response?.data?.error || "Failed to leave board", "error");
      }
    }
  };

  const handleDeleteBoard = async (
    workspaceName: string,
    boardName: string,
  ) => {
    if (
      confirm(
        `Are you sure you want to delete ${boardName}? This action is irreversible.`,
      )
    ) {
      try {
        await boardApi.deleteBoard(workspaceName, boardName);
        showToast("Successfully deleted board", "success");
        fetchBoards();
      } catch (e: any) {
        showToast(
          e?.response?.data?.error || "Failed to delete board",
          "error",
        );
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-8">
      {/* Create Board Section */}
      <div className="border border-white/10 bg-void-grey p-6 shadow-xl">
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

      {/* List Boards Section */}
      <div className="border border-white/10 bg-void-grey p-6 shadow-xl">
        <h2 className="text-xl font-bold font-mono text-white mb-6">
          Your Boards
        </h2>
        {loadingBoards ? (
          <p className="text-syntax-grey text-sm font-mono">
            Loading boards...
          </p>
        ) : userBoards.length === 0 ? (
          <p className="text-syntax-grey text-sm font-mono">No boards found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {userBoards.map((b) => (
              <div
                key={b.id}
                className="flex justify-between items-center p-4 border border-white/10 bg-white/5 rounded"
              >
                <div className="flex flex-col">
                  <span className="text-white font-medium">{b.name}</span>
                  <span className="text-syntax-grey text-xs">
                    Workspace: {b.workspaceName}
                  </span>
                </div>
                <div className="flex gap-2">
                  {b.role === "ADMIN" ? (
                    <button
                      onClick={() => handleDeleteBoard(b.workspaceName, b.name)}
                      className="px-3 py-1.5 text-xs bg-git-red/20 text-git-red rounded hover:bg-git-red/40 transition-colors"
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLeaveBoard(b.workspaceName, b.name)}
                      className="px-3 py-1.5 text-xs bg-white/10 text-white rounded hover:bg-white/20 transition-colors"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
