"use client";

import { useState, useRef, useEffect } from "react";
import { HelpCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

const GUIDE_PAGES = [
  {
    title: "Tasks & Pull Requests",
    content: (
      <div className="space-y-3">
        <p>
          Syncoboard seamlessly integrates with GitHub. When you open a Pull
          Request, a linked task is automatically generated in the appropriate
          board.
        </p>
        <p>
          You can also manually create unlinked tasks for brainstorming,
          tracking chores, or planning features before writing code.
        </p>
      </div>
    ),
  },
  {
    title: "CLI & Navigation",
    content: (
      <div className="space-y-3">
        <p>
          Syncoboard features a built-in Command Line Interface (CLI) and
          Vim-like navigation for maximum productivity.
        </p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Use <code>h/j/k/l</code> to navigate items within a section.
          </li>
          <li>
            Use <code>Ctrl + h/j/k/l</code> to jump between sections.
          </li>
          <li>
            Use the command bar to execute actions like adding, updating, or
            removing tasks. Type <code>/help</code> in the command bar to see
            available commands.
          </li>
        </ul>
      </div>
    ),
  },
  {
    title: "Collaboration & Setup",
    content: (
      <div className="space-y-3">
        <p>Work together with your team effectively:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Voice Calls:</strong> Connect instantly with your team using
            the integrated voice call feature on any board.
          </li>
          <li>
            <strong>Boards:</strong> Add new boards to your workspace to
            organize different projects or teams.
          </li>
          <li>
            <strong>Members:</strong> Invite colleagues to join your boards and
            start collaborating.
          </li>
        </ul>
      </div>
    ),
  },
];

export function AppGuide({ userCreatedAt }: { userCreatedAt?: string | Date }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userCreatedAt) {
      const createdDate = new Date(userCreatedAt);
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const isNewUser =
        new Date().getTime() - createdDate.getTime() < oneDayInMs;
      const hasOpened = localStorage.getItem("syncoboard_guide_opened");

      if (isNewUser && !hasOpened) {
        setTimeout(() => setShouldPulse(true), 0);
      }
    }
  }, [userCreatedAt]);

  const handleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen && shouldPulse) {
      setShouldPulse(false);
      localStorage.setItem("syncoboard_guide_opened", "true");
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as unknown as Node) /* eslint-disable-line no-restricted-syntax */
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className={`flex items-center justify-center p-2 rounded transition-colors focus:outline-none ${
          shouldPulse
            ? "text-neon-pulse animate-pulse bg-neon-pulse/10 hover:bg-neon-pulse/20"
            : "text-syntax-grey hover:bg-white/5 hover:text-white"
        }`}
        aria-label="App Guide"
      >
        <HelpCircle size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-void-grey border border-white/10 rounded-md shadow-2xl z-50 font-mono text-sm overflow-hidden flex flex-col">
          <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-white/5">
            <h3 className="text-white font-bold tracking-tight">
              {GUIDE_PAGES[currentPage].title}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-syntax-grey hover:text-white transition-colors focus:outline-none"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-4 text-syntax-grey flex-grow min-h-[160px]">
            {GUIDE_PAGES[currentPage].content}
          </div>

          <div className="px-4 py-3 border-t border-white/10 flex justify-between items-center bg-white/5">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className={`p-1 rounded transition-colors focus:outline-none ${
                currentPage === 0
                  ? "text-syntax-grey/30 cursor-not-allowed"
                  : "text-syntax-grey hover:bg-white/10 hover:text-white"
              }`}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex gap-2">
              {GUIDE_PAGES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors focus:outline-none ${
                    index === currentPage
                      ? "bg-neon-pulse"
                      : "bg-white/20 hover:bg-white/40"
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(GUIDE_PAGES.length - 1, prev + 1),
                )
              }
              disabled={currentPage === GUIDE_PAGES.length - 1}
              className={`p-1 rounded transition-colors focus:outline-none ${
                currentPage === GUIDE_PAGES.length - 1
                  ? "text-syntax-grey/30 cursor-not-allowed"
                  : "text-syntax-grey hover:bg-white/10 hover:text-white"
              }`}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
