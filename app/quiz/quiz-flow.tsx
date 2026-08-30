"use client";

import { ArrowLeft } from "lucide-react";
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

// Tahap 2: mesin kuis bersama (RATING & NEEDS) — lihat quiz-engine.tsx.

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
            <QuizEngine
              type={type}
              identity={identity}
              resultPath={resultPath}
            />
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
