import React from "react";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="w-full py-8 border-t border-white/5 mt-12 z-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Logo className="w-6 h-6" />
          <span className="text-syntax-grey font-mono text-sm">
            © {new Date().getFullYear()} Syncoboard. All rights reserved.
          </span>
        </div>
        <div className="flex gap-6 font-mono text-sm text-syntax-grey">
          <a
            href="https://github.com/syncoboard/syncoboard"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
