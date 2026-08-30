"use client";

import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import IdentityForm, { type Identity } from "./identity-form";
import QuizEngine from "./quiz-engine";

type QuizFlowProps = {
  type: "RATING" | "NEEDS";
  title: string;
  resultPath: string;
  questionCount: number;
};

function storageKey(type: "RATING" | "NEEDS") {
  return `fw-identity-${type}`;
}

const IDENTITY_EVENT = "financial-wellness:identity";

// Cache snapshot per jenis assessment agar getSnapshot selalu mengembalikan
// referensi yang sama saat nilai tidak berubah (syarat useSyncExternalStore).
const rawCache = new Map<string, string | null>();
const valueCache = new Map<string, Identity | null>();

// Fallback in-memory untuk tab yang sessionStorage-nya terblokir (private
// mode): identitas tetap dipakai untuk sesi berjalan, hilang saat refresh.
const memoryFallback = new Map<string, Identity>();

function readIdentity(type: "RATING" | "NEEDS"): Identity | null {
  let raw: string | null;
  try {
    raw = window.sessionStorage.getItem(storageKey(type));
  } catch {
    raw = null;
  }

  const mem = memoryFallback.get(type);
  const lastRaw = rawCache.get(type);
  if (rawCache.has(type) && lastRaw === raw) {
    return raw !== null ? (valueCache.get(type) ?? null) : (mem ?? null);
  }

  let value: Identity | null = null;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Identity;
      if (parsed.name && parsed.phone) value = parsed;
    } catch {
      value = null;
    }
  }
  rawCache.set(type, raw);
  valueCache.set(type, value);
  return value ?? (mem ?? null);
}

function subscribeIdentity(callback: () => void) {
  window.addEventListener(IDENTITY_EVENT, callback);
  return () => window.removeEventListener(IDENTITY_EVENT, callback);
}

function getServerIdentity(): Identity | null {
  return null;
}

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full;
}

function StepProgress({ step, questionCount }: { step: 1 | 2; questionCount: number }) {
  return (
    <div className="reveal-up ad-1 pt-10 sm:pt-14">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
        {step === 1
          ? "Langkah 1 dari 2 · Identitas"
          : `Langkah 2 dari 2 · ${questionCount} pertanyaan`}
      </p>
      <div className="mt-3 flex gap-1.5" aria-hidden>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <div className="progress-fill h-full w-full rounded-full bg-accent" />
        </div>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          {step === 2 && (
            <div className="progress-fill h-full w-full rounded-full bg-accent" />
          )}
        </div>
      </div>
    </div>
  );
}

// Tahap 2: placeholder kuis — Modul 5/9 akan mengisi engine pertanyaan di sini.
function QuizReadyState({
  identity,
  title,
  questionCount,
  onEdit,
}: {
  identity: Identity;
  title: string;
  questionCount: number;
  onEdit: () => void;
}) {
  return (
    <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-9">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-deep">
          <CheckCircle2 className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-semibold leading-tight tracking-tight text-ink">
            Halo, {firstName(identity.name)}!
          </h1>
          <p className="mt-1 text-sm text-muted">
            Identitas terkonfirmasi. {title} dimulai sekarang.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-paper/70 px-4 py-3 text-sm">
        <span className="font-semibold text-ink">{identity.name}</span>
        <span className="h-1 w-1 rounded-full bg-line" aria-hidden />
        <span className="text-muted">{identity.phone}</span>
        <button
          type="button"
          onClick={onEdit}
          className="ml-auto rounded-full px-2.5 py-1 text-xs font-semibold text-accent-deep underline-offset-2 transition-colors hover:bg-accent-tint hover:underline"
        >
          Ubah
        </button>
      </div>

      <div className="mt-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
          Pertanyaan 1 dari {questionCount}
        </p>
        <div className="mt-4 space-y-3" aria-hidden>
          <div className="h-5 w-3/4 animate-pulse rounded-full bg-line/80" />
          <div className="h-5 w-1/2 animate-pulse rounded-full bg-line/60" />
          <div className="mt-6 h-14 w-full animate-pulse rounded-2xl bg-line/50" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-line/50" />
          <div className="h-14 w-full animate-pulse rounded-2xl bg-line/50" />
        </div>
        <p className="mt-5 flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin text-accent-deep" aria-hidden />
          Menyiapkan pertanyaan untukmu…
        </p>
      </div>
    </section>
  );
}

export default function QuizFlow({
  type,
  title,
  resultPath,
  questionCount,
}: QuizFlowProps) {
  // Identitas disinkronkan dari sessionStorage via useSyncExternalStore —
  // refresh tab sama tidak mengulang langkah identitas (PRD Bab 11), dan
  // render SSR tetap aman karena server snapshot = null.
  const identity = useSyncExternalStore(
    subscribeIdentity,
    () => readIdentity(type),
    getServerIdentity,
  );

  function handleIdentity(id: Identity) {
    try {
      window.sessionStorage.setItem(storageKey(type), JSON.stringify(id));
    } catch {
      // private mode: persist gagal → simpan in-memory, lanjut sesi ini.
      memoryFallback.set(type, id);
    }
    window.dispatchEvent(new Event(IDENTITY_EVENT));
  }

  function resetIdentity() {
    try {
      window.sessionStorage.removeItem(storageKey(type));
    } catch {
      // abaikan
    }
    memoryFallback.delete(type);
    window.dispatchEvent(new Event(IDENTITY_EVENT));
  }

  const inQuiz = identity !== null;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-paper font-sans text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="bg-dots absolute inset-x-0 top-0 h-[560px]" />
        <div className="glow absolute -top-32 right-[-12%] h-[480px] w-[480px] rounded-full" />
      </div>

      <header className="relative z-10">
        <div className="mx-auto flex w-full max-w-[600px] items-center justify-between px-5 py-5 sm:px-6 sm:py-7">
          <Link
            href="/"
            className="-mx-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors duration-200 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Beranda
          </Link>
          <span className="font-serif text-xl font-semibold tracking-tight text-ink">
            Livin<span className="text-accent">&rsquo;</span>
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[600px] flex-1 px-5 pb-16 sm:px-6">
        <StepProgress step={inQuiz ? 2 : 1} questionCount={questionCount} />
        <div className="pt-6 sm:pt-8">
          {inQuiz && identity ? (
            type === "RATING" ? (
              <QuizEngine
                type={type}
                identity={identity}
                resultPath={resultPath}
              />
            ) : (
              // Engine pertanyaan NEEDS disambungkan di Modul 9.
              <QuizReadyState
                identity={identity}
                title={title}
                questionCount={questionCount}
                onEdit={resetIdentity}
              />
            )
          ) : (
            <IdentityForm
              assessmentType={type}
              assessmentTitle={title}
              resultPath={resultPath}
              onIdentity={handleIdentity}
            />
          )}
        </div>
      </main>
    </div>
  );
}
