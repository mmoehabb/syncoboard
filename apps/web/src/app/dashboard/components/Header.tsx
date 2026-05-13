"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import { LogOut, Settings, ChevronDown } from "lucide-react";
import { Logo } from "@/components/Logo";
import Link from "next/link";
import { AppGuide } from "./AppGuide";
import { NotificationsDropdown } from "./NotificationsDropdown";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-14 border-b border-white/10 bg-obsidian-night flex items-center justify-between px-6 z-20 relative">
      <div className="flex items-center gap-2 font-mono font-bold text-white tracking-tight">
        <Logo className="w-8 h-8" />
        <span>SYNCOBOARD</span>
      </div>

      {session?.user && (
        <div className="flex items-center gap-2">
          <AppGuide userCreatedAt={session.user.createdAt} />
          <NotificationsDropdown />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 hover:bg-white/5 p-1.5 rounded transition-colors"
            >
              <div className="flex flex-col items-end">
                <span className="text-sm text-white font-mono">
                  {session.user.name || "User"}
                </span>
              </div>
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full border border-white/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-void-grey border border-white/20 flex items-center justify-center text-syntax-grey font-mono">
                  {session.user.name?.[0]?.toUpperCase() || "?"}
                </div>
              )}
              <ChevronDown size={14} className="text-syntax-grey" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-void-grey border border-white/10 rounded-md shadow-xl py-1 font-mono text-sm">
                <Link
                  href={"/settings"}
                  className="w-full px-4 py-2 text-left text-syntax-grey hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <Settings size={14} />
                  <span>Settings</span>
                </Link>
                <div className="h-px bg-white/10 my-1"></div>
                <button
                  onClick={() => {
                    localStorage.clear();
                    signOut({ callbackUrl: "/login" });
                  }}
                  className="w-full px-4 py-2 text-left text-syntax-grey hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
