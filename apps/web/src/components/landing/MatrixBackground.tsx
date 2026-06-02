"use client";

import React, { useState, useEffect } from "react";

// Pre-compute a pool of random character sequences at the module scope
// to avoid expensive array allocations and string generation on mount.
const CHAR_POOL_SIZE = 50;
const PRECOMPUTED_CHARS = Array.from({ length: CHAR_POOL_SIZE }).map(() =>
  Array.from({ length: 20 }).map(() =>
    String.fromCharCode(33 + Math.floor(Math.random() * 94))
  )
);

export function MatrixBackground() {
  const [columns, setColumns] = useState<
    {
      col: number;
      top: string;
      animation: string;
      animationDelay: string;
      chars: string[];
    }[]
  >([]);

  useEffect(() => {
    // Generate some random columns for the matrix effect asynchronously
    // to avoid synchronously triggering state updates inside useEffect
    const timeoutId = setTimeout(() => {
      const colCount = Math.floor(window.innerWidth / 15);
      const newColumns = Array.from({ length: colCount }).map((_, i) => {
        const chars = PRECOMPUTED_CHARS[i % CHAR_POOL_SIZE];

        return {
          col: i,
          top: `-${Math.random() * 100}%`,
          animation: `fall ${Math.random() * 5 + 5}s linear infinite`,
          animationDelay: `-${Math.random() * 5}s`,
          chars,
        };
      });
      setColumns(newColumns);
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
      {columns.map((columnData) => (
        <div
          key={columnData.col}
          className="absolute text-git-green font-mono text-sm"
          style={{
            left: `${columnData.col * 15}px`,
            top: columnData.top,
            animation: columnData.animation,
            animationDelay: columnData.animationDelay,
          }}
        >
          {columnData.chars.map((char, i) => (
            <div key={i} className="my-1">
              {char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
