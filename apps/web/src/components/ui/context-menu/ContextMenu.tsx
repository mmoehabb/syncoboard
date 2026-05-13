"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  children: React.ReactNode;
}

export function ContextMenu({ x, y, onClose, children }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    // Prevent scrolling from closing the menu immediately if they just scrolled slightly,
    // but maybe close on larger scrolls or just leave it up to the user.
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Ensure menu stays within viewport bounds
  let adjustedX = x;
  let adjustedY = y;

  if (typeof window !== "undefined") {
    if (x + 200 > window.innerWidth) {
      // Assume 200px roughly
      adjustedX = window.innerWidth - 220;
    }
    if (y + 300 > window.innerHeight) {
      // Assume 300px roughly max height
      adjustedY = window.innerHeight - 320;
    }
  }

  return createPortal(
    <div
      ref={menuRef}
      style={{
        position: "fixed",
        top: Math.max(10, adjustedY),
        left: Math.max(10, adjustedX),
        zIndex: 9999,
      }}
      className="bg-void-grey border border-white/20 shadow-2xl rounded-md min-w-[160px] py-1 font-mono text-sm flex flex-col"
    >
      {children}
    </div>,
    document.body,
  );
}

interface ContextMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  disabled?: boolean;
}

export function ContextMenuItem({
  children,
  onClick,
  className = "",
  onMouseEnter,
  onMouseLeave,
  disabled = false,
}: ContextMenuItemProps) {
  return (
    <button
      disabled={disabled}
      onClick={(e) => {
        if (!disabled && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`w-full text-left px-4 py-2 hover:bg-white/10 text-white transition-colors flex items-center justify-between ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {children}
    </button>
  );
}

interface ContextMenuSubMenuProps {
  label: string;
  children: React.ReactNode;
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function ContextMenuSubMenu({
  label,
  children,
  isOpen,
  onMouseEnter,
  onMouseLeave,
}: ContextMenuSubMenuProps) {
  return (
    <div
      className="relative"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <ContextMenuItem>
        <span>{label}</span>
        <span className="text-white/50 text-xs ml-2">▶</span>
      </ContextMenuItem>

      {isOpen && (
        <div className="absolute left-full top-0 ml-1 bg-void-grey border border-white/20 shadow-2xl rounded-md min-w-[160px] py-1">
          {children}
        </div>
      )}
    </div>
  );
}
