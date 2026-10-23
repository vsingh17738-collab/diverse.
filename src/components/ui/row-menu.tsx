"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function RowMenu({ actions, label = "Actions" }: { actions: MenuAction[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const width = 196;

  const position = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = actions.length * 36 + 12;
    const openUp = rect.bottom + menuHeight > window.innerHeight - 12;
    setCoords({
      top: openUp ? rect.top - menuHeight - 6 : rect.bottom + 6,
      left: Math.min(rect.right - width, window.innerWidth - width - 12),
    });
  }, [actions.length]);

  useEffect(() => {
    if (!open) return;
    position();
    const onClick = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("scroll", position, true);
    window.addEventListener("resize", position);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", position, true);
      window.removeEventListener("resize", position);
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, position]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={label}
        aria-expanded={open}
        className={cn("icon-btn h-8 w-8", open && "border-white/20 bg-white/[0.08] text-white")}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left, width }}
            className="fixed z-[80] overflow-hidden rounded-xl border border-white/10 bg-[#12121d] p-1 shadow-2xl animate-[scale-in_0.14s_ease]"
          >
            {actions.map((a) => (
              <button
                key={a.label}
                disabled={a.disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  a.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium transition-colors",
                  a.danger
                    ? "text-rose-300 hover:bg-danger/10"
                    : "text-white/70 hover:bg-white/[0.06] hover:text-white",
                  a.disabled && "cursor-not-allowed opacity-40",
                )}
              >
                {a.icon}
                {a.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
