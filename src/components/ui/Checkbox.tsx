"use client";

// Checkbox.tsx — Pengganti <input type="checkbox"> bawaan browser.
// Seluruh baris (kotak + label) bisa diklik; Spasi men-toggle saat fokus.

import { useId } from "react";
import { Check } from "lucide-react";

type CheckboxProps = {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({ checked, onChange, label, description, disabled, className = "" }: CheckboxProps) {
  const id = useId();
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-labelledby={`${id}-l`}
      aria-describedby={description ? `${id}-d` : undefined}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`flex items-start gap-2.5 text-left py-1 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none group ${className}`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors group-focus-visible:ring-2 group-focus-visible:ring-gold/50 ${
          checked ? "bg-maroon border-maroon text-white" : "bg-surface-1 border-neutral-300"
        }`}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span className="min-w-0">
        <span id={`${id}-l`} className="block text-sm text-text-high">
          {label}
        </span>
        {description && (
          <span id={`${id}-d`} className="block text-xs text-text-low mt-0.5">
            {description}
          </span>
        )}
      </span>
    </button>
  );
}
