"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CornerDownLeft, Search } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/utils";

const QUICK_ACTIONS = [
  { label: "New booking", href: "/bookings?new=1", hint: "Book a station" },
  { label: "Add member", href: "/members?new=1", hint: "Create account" },
  { label: "Add game", href: "/games?new=1", hint: "Library" },
  { label: "Create tournament", href: "/tournaments?new=1", hint: "Bracket" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => {
    const all = [...NAV_ITEMS, ...QUICK_ACTIONS];
    if (!query.trim()) return all;
    const q = query.toLowerCase();
    return all.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        ("description" in i && i.description.toLowerCase().includes(q)) ||
        ("hint" in i && i.hint.toLowerCase().includes(q)),
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, items.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      }
      if (e.key === "Enter" && items[active]) {
        e.preventDefault();
        router.push(items[active].href);
        onClose();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, items, active, onClose, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12vh]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fade-in_0.15s_ease]" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b14] shadow-2xl animate-[scale-in_0.18s_ease]">
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-4">
          <Search className="h-4 w-4 text-white/30" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Jump to a page or action…"
            className="flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-white/30"
          />
          <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/40">
            ESC
          </kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-xs text-muted">
              No matches for “{query}”
            </p>
          )}
          {items.map((item, i) => {
            const Icon = "icon" in item ? item.icon : ArrowRight;
            return (
              <button
                key={item.href + item.label}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  router.push(item.href);
                  onClose();
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                  active === i ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-white/60">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white/90">{item.label}</span>
                  <span className="block truncate text-[11px] text-muted">
                    {"description" in item ? item.description : item.hint}
                  </span>
                </span>
                {active === i && <CornerDownLeft className="h-3.5 w-3.5 text-white/30" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
