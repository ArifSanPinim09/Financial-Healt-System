"use client";

import {
  AlertCircle,
  ArrowRight,
  History,
  Loader2,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useEffect, useRef, useState } from "react";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";

export type Identity = {
  name: string;
  phone: string;
  normalizedPhone: string;
  savedAt: string;
};

type CheckState = "idle" | "checking" | "error";

type IdentityFormProps = {
  assessmentType: "RATING" | "NEEDS";
  assessmentTitle: string;
  resultPath: string;
  onIdentity: (identity: Identity) => void;
};

const NAME_MIN = 2;

function inputClass(hasError: boolean) {
  return [
    "h-[3.25rem] w-full rounded-2xl border bg-paper/70 px-4 text-base text-ink",
    "placeholder:text-muted/50 transition-[border-color,box-shadow,opacity] duration-200",
    "focus:outline-none disabled:opacity-60",
    hasError
      ? "border-error-line focus:border-error focus:ring-4 focus:ring-error/15"
      : "border-line focus:border-accent focus:ring-4 focus:ring-accent/15",
  ].join(" ");
}

function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-2 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-error"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export default function IdentityForm({
  assessmentType,
  assessmentTitle,
  resultPath,
  onIdentity,
}: IdentityFormProps) {
  const router = useRouter();
  const uid = useId();
  const nameId = `${uid}-name`;
  const phoneId = `${uid}-phone`;
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const [found, setFound] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  // Auto-focus nama saat form muncul (mobile-friendly).
  useEffect(() => {
    const t = setTimeout(() => nameInputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  // F14: sudah pernah isi → redirect ke hasil lama (skip quiz).
  useEffect(() => {
    if (!found) return;
    const t = setTimeout(
      () => router.push(`${resultPath}?id=${found}`),
      2500,
    );
    return () => clearTimeout(t);
  }, [found, resultPath, router]);

  function validate(): boolean {
    let ok = true;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Nama kamu wajib diisi dulu.");
      ok = false;
    } else if (trimmedName.length < NAME_MIN) {
      setNameError("Nama minimal 2 huruf ya.");
      ok = false;
    } else {
      setNameError(null);
    }

    if (!phone.trim()) {
      setPhoneError("Nomor HP wajib diisi.");
      ok = false;
    } else if (!normalizeIndonesianPhone(phone)) {
      setPhoneError(
        "Format nomor belum tepat. Contoh: 0812 3456 7890 atau +62 812 3456 7890.",
      );
      ok = false;
    } else {
      setPhoneError(null);
    }

    return ok;
  }

  async function runCheck() {
    setCheckState("checking");
    try {
      const res = await fetch("/api/submission-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, assessmentType }),
      });
      const json = (await res.json().catch(() => null)) as {
        found?: boolean;
        submissionId?: string;
        error?: { code?: string; message?: string };
      } | null;
      if (!res.ok || !json) {
        throw new Error(json?.error?.code ?? "INTERNAL");
      }
      if (json.found && json.submissionId) {
        setFound(json.submissionId);
      } else {
        onIdentity({
          name: name.trim(),
          phone: phone.trim(),
          normalizedPhone: normalizeIndonesianPhone(phone) ?? phone.trim(),
          savedAt: new Date().toISOString(),
        });
      }
    } catch {
      setCheckState("error");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (checkState === "checking") return;
    if (!validate()) {
      setShake(true);
      return;
    }
    void runCheck();
  }

  if (found) {
    return (
      <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint text-accent-deep">
            <History className="h-7 w-7" strokeWidth={1.8} aria-hidden />
          </span>
          <h1 className="mt-5 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
            Kamu sudah pernah mengisi ini
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
            Nomor ini sudah pernah menyelesaikan{" "}
            <span className="font-semibold text-ink">{assessmentTitle}</span>.
            Kami arahkan ke hasil yang sudah kamu terima.
          </p>
          <button
            type="button"
            onClick={() => router.push(`${resultPath}?id=${found}`)}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
          >
            Lihat hasil kamu
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted/90">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            Mengalihkan otomatis dalam beberapa detik…
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-9">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
        Langkah 1 · Identitas
      </p>
      <h1 className="mt-3 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink sm:text-4xl">
        Halo! Mulai dengan
        <br />
        <em className="font-medium italic text-accent-deep">
          perkenalan singkat.
        </em>
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        Nama dan nomor HP dipakai agar tim cabang bisa menghubungi kamu setelah
        assessment selesai. Tidak untuk hal lain.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        onAnimationEnd={() => setShake(false)}
        className={shake ? "shake mt-7" : "mt-7"}
      >
        <div>
          <label
            htmlFor={nameId}
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Nama lengkap
          </label>
          <input
            id={nameId}
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder="Contoh: Budi Santoso"
            autoComplete="name"
            disabled={checkState === "checking"}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${nameId}-error` : undefined}
            className={inputClass(Boolean(nameError))}
          />
          {nameError && <FieldError id={`${nameId}-error`} message={nameError} />}
        </div>

        <div className="mt-5">
          <label
            htmlFor={phoneId}
            className="mb-2 block text-sm font-semibold text-ink"
          >
            Nomor HP
          </label>
          <input
            id={phoneId}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (phoneError) setPhoneError(null);
            }}
            placeholder="0812 3456 7890"
            autoComplete="tel"
            disabled={checkState === "checking"}
            aria-invalid={phoneError ? true : undefined}
            aria-describedby={phoneError ? `${phoneId}-error` : undefined}
            className={inputClass(Boolean(phoneError))}
          />
          {phoneError && (
            <FieldError id={`${phoneId}-error`} message={phoneError} />
          )}
        </div>

        {checkState === "error" && (
          <div
            role="alert"
            className="mt-5 flex items-start gap-3 rounded-2xl border border-error-line bg-error-tint p-4"
          >
            <WifiOff
              className="mt-0.5 h-5 w-5 shrink-0 text-error-deep"
              aria-hidden
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-error-deep">
                Sepertinya ada gangguan.
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-error-deep/70">
                Data kamu aman dan tidak hilang. Silakan coba lagi ya.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCheckState("idle");
                void runCheck();
              }}
              className="shrink-0 rounded-full border border-error-line bg-card px-3.5 py-2 text-xs font-semibold text-error-deep transition-colors duration-200 hover:bg-error hover:text-white"
            >
              Coba lagi
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={checkState === "checking"}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checkState === "checking" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Memeriksa data…
            </>
          ) : (
            <>
              Lanjut ke assessment
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted/90">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Hanya dipakai untuk follow-up assessment ini.
        </p>
      </form>
    </section>
  );
}
