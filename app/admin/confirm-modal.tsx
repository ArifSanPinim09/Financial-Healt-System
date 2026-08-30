"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

// Modal konfirmasi untuk aksi destruktif (hapus submission, Bab F10):
// "Konfirmasi wajib sebelum hapus". Full-screen di mobile, kartu center
// di desktop (Bab 19). Aksesibel: dialog + aria-modal, fokus ke tombol
// pembatal (default aman), Escape & klik backdrop untuk menutup.

export default function ConfirmModal({
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup dialog"
        onClick={() => !busy && onCancel()}
        className="backdrop-in absolute inset-0 bg-ink/45"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="sheet-in relative z-10 flex w-full flex-col rounded-t-[1.75rem] border-t border-line bg-card p-6 sm:max-w-md sm:rounded-[1.75rem] sm:border sm:p-8"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-error-tint">
          <AlertTriangle className="h-6 w-6 text-error" strokeWidth={1.9} aria-hidden />
        </span>

        <h2
          id="confirm-title"
          className="mt-5 font-serif text-2xl font-semibold leading-tight tracking-tight text-ink"
        >
          {title}
        </h2>
        <p
          id="confirm-desc"
          className="mt-2.5 text-base leading-relaxed text-muted"
        >
          {description}
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="flex h-12 items-center justify-center rounded-full border border-line px-6 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-error px-6 text-sm font-semibold text-white transition-all duration-200 hover:bg-error-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? "Menghapus…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
