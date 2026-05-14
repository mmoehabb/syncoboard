"use client";

import { useEffect, useRef, useState } from "react";

export function Cursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isDimmed, setIsDimmed] = useState(false);

  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX - 8}px, ${e.clientY - 8}px, 0)`;
      }
      setIsDimmed(false); // Restore full color on movement
    };

    const handleKeyDown = () => {
      setIsDimmed(true); // Dim on key press
    };

    window.addEventListener("mousemove", updatePosition);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousemove", updatePosition);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 w-4 h-4 rounded-full pointer-events-none z-[99999] transition-colors transition-opacity transition-shadow duration-200 ${
        isDimmed ? "bg-syntax-grey opacity-50" : "bg-neon-pulse"
      }`}
      style={{
        boxShadow: isDimmed ? "none" : "0 0 10px 2px rgba(0, 245, 255, 0.5)",
      }}
    />
  );
}
