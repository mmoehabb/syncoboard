"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ParticleNetwork } from "@/components/ui/ParticleNetwork";
import { Logo } from "@/components/Logo";

export function AuthForm() {
  const searchParams = useSearchParams();
  const port = searchParams.get("port");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuthorize = async () => {
    if (!port) {
      setErrorMsg("Missing port parameter.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/cli", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || "Failed to generate token");
      }

      const { token } = await res.json();

      // Redirect to the CLI local server
      window.location.href = `http://localhost:${port}?token=${token}`;
      setStatus("success");
    } catch (error: unknown) {
      console.error(error);
      setErrorMsg((error instanceof Error ? error.message : "Unknown error"));
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-screen w-full p-8 bg-obsidian-night relative overflow-hidden font-mono">
        <ParticleNetwork />
        <main className="w-full max-w-md z-10 flex flex-col gap-8 surface-panel p-8 bg-void-grey/80 backdrop-blur-md border border-git-green/20 rounded-md shadow-2xl text-center items-center">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded bg-obsidian-night border border-git-green/30 flex items-center justify-center text-git-green font-bold text-4xl mb-2">
              <Logo />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              CLI Authorized!
            </h1>
            <p className="text-syntax-grey text-sm">
              You can safely close this page and return to your terminal.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-screen w-full p-8 bg-obsidian-night relative overflow-hidden font-mono">
      <ParticleNetwork />
      <main className="w-full max-w-md z-10 flex flex-col gap-8 surface-panel p-8 bg-void-grey/80 backdrop-blur-md border border-white/10 rounded-md shadow-2xl text-center items-center">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded bg-obsidian-night border border-white/10 flex items-center justify-center text-neon-pulse font-bold text-4xl mb-2">
            <Logo />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Authorize CLI
          </h1>
          <p className="text-syntax-grey text-sm">
            Syncoboard CLI is requesting access to your account.
          </p>
        </div>

        {status === "error" && (
          <div className="w-full p-3 bg-red-900/20 border border-red-500/50 text-red-400 rounded text-sm text-left">
            {errorMsg}
          </div>
        )}

        <button
          onClick={handleAuthorize}
          disabled={status === "loading" || !port}
          className="w-full bg-git-green hover:bg-opacity-90 text-obsidian-night font-bold py-3 px-4 rounded transition-all focus:outline-none focus:ring-2 focus:ring-git-green focus:ring-offset-2 focus:ring-offset-obsidian-night disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "loading" ? "Authorizing..." : "Authorize CLI"}
        </button>
      </main>
    </div>
  );
}
