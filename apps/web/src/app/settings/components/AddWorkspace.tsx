"use client";

import { useState } from "react";
import { workspaceApi } from "@syncoboard/api";
import { useRouter } from "next/navigation";

export function AddWorkspace() {
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName) {
      setError("Workspace Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await workspaceApi.createWorkspace({
        name: workspaceName,
      });

      router.push("/dashboard");
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        (err as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to create workspace.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto border border-white/10 bg-void-grey p-6 shadow-xl mb-8">
      <h2 className="text-xl font-bold font-mono text-white mb-6">
        Add New Workspace
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 text-sm font-mono">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-mono text-syntax-grey mb-2">
            Workspace Name
          </label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full bg-obsidian-night border border-white/10 text-white font-mono p-2 focus:border-git-green focus:outline-none transition-colors cmd-selectable [&.cmd-selected]:border-git-green [&.cmd-selected]:bg-git-green/5"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-git-green text-obsidian-night font-bold font-mono py-2 hover:bg-opacity-90 transition-opacity disabled:opacity-50 cmd-selectable [&.cmd-selected]:ring-2 [&.cmd-selected]:ring-white [&.cmd-selected]:ring-offset-2 [&.cmd-selected]:ring-offset-void-grey"
        >
          {isSubmitting ? "Creating..." : "Create Workspace"}
        </button>
      </form>
    </div>
  );
}
