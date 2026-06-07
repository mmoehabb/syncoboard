import React from "react";

export function CliAd() {
  return (
    <section className="py-20 border-t border-white/5 z-10 relative">
      <div className="flex flex-col items-center text-center gap-6">
        <h3 className="text-3xl font-bold text-white">
          Manage your tasks from the terminal.
        </h3>
        <p className="text-syntax-grey text-lg max-w-2xl">
          Introducing the Syncoboard CLI. You don't even need to leave your
          terminal to manage your workspace, boards, and tasks. Built with Go
          for lightning-fast performance.
        </p>

        <div className="surface-panel p-6 border border-white/10 rounded-lg bg-void-grey/50 mt-4 max-w-3xl w-full text-left">
          <div className="font-mono text-sm text-syntax-grey mb-4 flex items-center gap-2">
            <span className="text-neon-pulse">●</span> terminal
          </div>
          <div className="font-mono text-sm text-white bg-black/50 p-4 rounded border border-white/5 overflow-x-auto">
            <p className="text-git-green"># Install the CLI tool</p>
            <p className="mt-1">
              $ go install github.com/syncoboard/syncoboard-cli@latest
            </p>
            <p className="text-git-green mt-4"># Start using it immediately</p>
            <p className="mt-1">$ syncoboard-cli</p>
          </div>
        </div>

        <div className="mt-4">
          <a
            href="https://github.com/syncoboard/syncoboard-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neon-pulse hover:underline font-mono"
          >
            View on GitHub &rarr;
          </a>
        </div>
      </div>
    </section>
  );
}
