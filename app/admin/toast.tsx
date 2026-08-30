"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

// Toast ringan untuk feedback aksi admin (Bab F10/16.7:
// "Perubahan disimpan" / "Data berhasil dihapus"). Komponen mandiri
// (tanpa library) — konsisten dengan design system (Bab 20).

export type ToastKind = "success" | "error";

export interface ToastData {
  id: number;
  kind: ToastKind;
  message: string;
}

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null);

  function showToast(kind: ToastKind, message: string) {
    setToast({ id: Date.now(), kind, message });
  }

  return { toast, showToast, dismissToast: () => setToast(null) };
}

export function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastData | null;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  // Keyframe masuk (translateY) + auto-hide 3,5 detik.
  useEffect(() => {
    if (!toast) return;
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), 3500);
    return () => {
      clearTimeout(t);
      setVisible(false);
    };
  }, [toast]);

  // Berpindah ke halaman lain (mis. setelah hapus) → jangan biarkan toast
  // lama menempel; biarkan unmount berjalan natural.
  if (!toast) return null;

  const isSuccess = toast.kind === "success";
  return (
    <div
      className={`fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4 transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`flex items-center gap-3 rounded-full border bg-card py-3 pl-4 pr-3 shadow-[0_18px_40px_-18px_rgba(15,29,28,0.45)] ${
          isSuccess ? "border-accent/30" : "border-error-line"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-accent"
            strokeWidth={2}
            aria-hidden
          />
        ) : (
          <AlertCircle
            className="h-5 w-5 shrink-0 text-error"
            strokeWidth={2}
            aria-hidden
          />
        )}
        <p
          className={`text-sm font-semibold ${
            isSuccess ? "text-ink" : "text-error-deep"
          }`}
        >
          {toast.message}
        </p>
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-medium text-muted transition-colors hover:bg-paper hover:text-ink"
          aria-label="Tutup notifikasi"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}
