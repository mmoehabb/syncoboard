import React from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export function Header() {
  return (
    <header className="flex justify-between items-center w-full pb-6 border-b border-white/5 pt-8 z-20 relative">
      <div className="flex items-center gap-3">
        <Logo className="w-8 h-8" />
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-tight">
            Syncoboard
          </h1>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-neon-pulse/10 text-neon-pulse border border-neon-pulse/20">
            Open Beta
          </span>
        </div>
      </div>
      <nav className="flex gap-4 font-mono text-sm">
        <Link
          href="/login"
          className="bg-neon-pulse text-obsidian-night px-4 py-2 rounded font-semibold hover:bg-neon-pulse/90 transition-colors"
        >
          Login
        </Link>
      </nav>
    </header>
  );
}
