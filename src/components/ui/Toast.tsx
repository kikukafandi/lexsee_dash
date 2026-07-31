"use client";

// Toast.tsx — notifikasi singkat setelah sebuah tindakan berhasil/gagal.
// Dipakai lokal per halaman (tidak menyentuh layout global): panggil useToast()
// lalu render <Toast state={toast} />.

import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

export type ToastState = { message: string; type: "success" | "error" } | null;

export function useToast(durationMs = 3500) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ message, type });
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { toast, showToast };
}

export function Toast({ state }: { state: ToastState }) {
  if (!state) return null;
  const ok = state.type === "success";
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-sm z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-surface-1 border border-neutral-200 shadow-lg"
    >
      {ok ? (
        <CheckCircle2 size={18} className="text-success shrink-0" />
      ) : (
        <XCircle size={18} className="text-danger shrink-0" />
      )}
      <p className="text-text-high text-sm">{state.message}</p>
    </div>
  );
}
