"use client";

// Select.tsx — Dropdown pengganti <select> bawaan browser.
// Daftar opsi dirender lewat portal supaya tidak terpotong modal atau tabel.
// Esc menutup daftar saja; event-nya dihentikan agar modal di belakang tidak ikut tertutup.

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption<T extends string> = { value: T; label: string };

type SelectProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: SelectOption<T>[];
  /** Label untuk pembaca layar; tampil juga kalau `showLabel`. */
  label: string;
  showLabel?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const triggerCls =
  "w-full flex items-center justify-between gap-2 bg-surface-2 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-left text-text-high focus:outline-none focus:border-maroon focus:ring-1 focus:ring-gold/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  showLabel = false,
  placeholder = "Pilih…",
  disabled,
  className = "",
}: SelectProps<T>) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.value === value);

  const place = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const listH = Math.min(options.length * 36 + 8, 280);
    const below = window.innerHeight - r.bottom > listH + 8;
    setPos({ top: below ? r.bottom + 4 : r.top - listH - 4, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    const reposition = () => place();
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openList = () => {
    if (disabled) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    setOpen(true);
  };

  const choose = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div className={className}>
      <span id={`${id}-label`} className={showLabel ? "block text-xs text-text-med mb-1" : "sr-only"}>
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={triggerCls}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        aria-controls={open ? `${id}-list` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span id={`${id}-value`} className={selected ? "truncate" : "truncate text-text-low"}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={16} className={`shrink-0 text-text-low transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-labelledby={`${id}-label`}
            style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            className="z-[70] max-h-[280px] overflow-auto rounded-lg border border-neutral-200 bg-surface-1 py-1 shadow-lg"
          >
            {options.map((o, i) => {
              const isSel = o.value === value;
              return (
                <li
                  key={o.value}
                  id={`${id}-opt-${i}`}
                  role="option"
                  aria-selected={isSel}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(i)}
                  className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${
                    i === active ? "bg-surface-2 text-text-high" : "text-text-med"
                  }`}
                >
                  <span className="truncate">{o.label}</span>
                  {isSel && <Check size={14} className="shrink-0 text-maroon" aria-hidden="true" />}
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
