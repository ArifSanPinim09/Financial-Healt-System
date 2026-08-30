"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { Identity } from "./identity-form";

// Mesin kuis reusable (F2, Bab 16.2) — 1 pertanyaan per layar.
// UX sesuai PRD:
// - Progress indicator atas + "Soal X dari Y" (Bab 16.2)
// - Option card gaya radio, besar & mudah di-tap (Bab 16.2, 21: tap >= 44px)
// - Opsi dengan "keterangan tambahan" menampilkan detail saat dipilih (Bab 17)
// - Tombol "Lanjut" eksplisit (bukan auto-advance), aktif setelah memilih (Bab 17)
// - Tombol "Kembali" untuk ubah jawaban sebelumnya (Bab 17)
// - Refresh di tengah kuis tidak mengulang dari Q1 (Bab 11: persist per soal)
// - Skor opsi tidak pernah ditampilkan (F2)
// - Error load/submit: banner ramah + retry, jawaban tidak hilang (Bab 11)

type QuizOption = {
  optionId: string;
  text: string;
  detail: string | null;
};

type QuizQuestion = {
  questionId: string;
  dimension: string | null;
  isScoring: boolean;
  text: string;
  options: QuizOption[];
};

type Answers = Record<string, string>; // questionId -> optionId

type Phase = "loading" | "error" | "quiz" | "done";

type QuizEngineProps = {
  type: "RATING" | "NEEDS";
  identity: Identity;
  resultPath: string;
};

function answersKey(type: "RATING" | "NEEDS") {
  return `fw-answers-${type}`;
}

function submittedKey(type: "RATING" | "NEEDS") {
  return `fw-submitted-${type}`;
}

function firstName(full: string) {
  return full.trim().split(/\s+/)[0] ?? full;
}

function eyebrowFor(question: QuizQuestion, type: "RATING" | "NEEDS"): string {
  if (question.dimension) return question.dimension;
  if (type === "NEEDS") return "Kebutuhan Kredit";
  if (question.questionId === "Q13_RATING") return "Tujuan Finansial";
  if (question.questionId === "Q14_RATING") return "Kebutuhan Finansial";
  return "Lanjutan";
}

export default function QuizEngine({
  type,
  identity,
  resultPath,
}: QuizEngineProps) {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [movingBack, setMovingBack] = useState(false);
  const booted = useRef(false);

  async function loadQuestions(restore: boolean) {
    setPhase("loading");
    try {
      const res = await fetch(`/api/questions?type=${type}`);
      const json = (await res.json().catch(() => null)) as {
        questions?: QuizQuestion[];
      } | null;
      if (!res.ok || !json?.questions || json.questions.length === 0) {
        throw new Error(`gagal memuat pertanyaan (${res.status})`);
      }
      const loaded = json.questions;
      setQuestions(loaded);

      if (restore) {
        try {
          const raw = window.sessionStorage.getItem(answersKey(type));
          if (raw) {
            const saved = JSON.parse(raw) as {
              answers: Answers;
              index: number;
            };
            if (saved && typeof saved.index === "number" && saved.answers) {
              setAnswers(saved.answers);
              setIndex(
                Math.min(
                  Math.max(0, saved.index),
                  loaded.length - 1,
                ),
              );
            }
          }
        } catch {
          // data lama korup → mulai dari Q1, jawaban baru akan tersimpan lagi.
        }
      }
      setPhase("quiz");
    } catch (err) {
      console.error("[quiz] gagal memuat pertanyaan:", err);
      setPhase("error");
    }
  }

  async function boot() {
    // Sudah pernah submit (F14 / refresh setelah selesai) → langsung
    // tampilkan status selesai, jangan ulang kuis.
    try {
      const raw = window.sessionStorage.getItem(submittedKey(type));
      if (raw) {
        const saved = JSON.parse(raw) as { submissionId: string };
        if (saved?.submissionId) {
          setSubmissionId(saved.submissionId);
          setPhase("done");
          return;
        }
      }
    } catch {
      // abaikan — lanjut muat kuis
    }
    await loadQuestions(true);
  }

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist jawaban + posisi soal (Bab 11) — refresh tidak mengulang dari Q1.
  useEffect(() => {
    if (phase !== "quiz" || questions.length === 0) return;
    try {
      window.sessionStorage.setItem(
        answersKey(type),
        JSON.stringify({ answers, index }),
      );
    } catch {
      // private mode: lanjut tanpa persist
    }
  }, [phase, questions.length, answers, index, type]);

  function selectOption(optionId: string) {
    const questionId = questions[index]?.questionId;
    if (!questionId) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    setSubmitError(null);
  }

  function goNext() {
    if (phase !== "quiz" || sending) return;
    if (index < questions.length - 1) {
      setMovingBack(false);
      setIndex((i) => Math.min(i + 1, questions.length - 1));
      window.scrollTo(0, 0);
    } else {
      void submitAll();
    }
  }

  function goBack() {
    if (phase !== "quiz" || sending) return;
    if (index > 0) {
      setMovingBack(true);
      setIndex((i) => Math.max(i - 1, 0));
      window.scrollTo(0, 0);
    }
  }

  async function submitAll() {
    setSending(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: identity.name,
          phone: identity.phone,
          assessmentType: type,
          answers: questions.map((q) => ({
            questionId: q.questionId,
            optionId: answers[q.questionId] ?? "",
          })),
        }),
      });
      const json = (await res.json().catch(() => null)) as {
        submissionId?: string;
        error?: { code?: string; message?: string };
      } | null;

      if (res.ok && json?.submissionId) {
        try {
          window.sessionStorage.setItem(
            submittedKey(type),
            JSON.stringify({
              submissionId: json.submissionId,
              at: new Date().toISOString(),
            }),
          );
          window.sessionStorage.removeItem(answersKey(type));
        } catch {
          // abaikan — status selesai tetap tampil untuk sesi ini
        }
        setSubmissionId(json.submissionId);
        setPhase("done");
        return;
      }

      if (
        res.status === 400 &&
        json?.error?.code === "INCOMPLETE_ANSWERS"
      ) {
        // AC10: arahkan ke soal yang belum dijawab.
        const error = json.error as { missingQuestionIds?: string[] };
        const missing = error.missingQuestionIds ?? [];
        const firstMissing = questions.findIndex((q) =>
          missing.includes(q.questionId),
        );
        if (firstMissing >= 0) {
          setMovingBack(true);
          setIndex(firstMissing);
          window.scrollTo(0, 0);
        }
        setSubmitError(
          "Sepertinya ada jawaban yang belum lengkap. Silakan cek kembali ya — jawabanmu yang lain aman.",
        );
        return;
      }

      throw new Error(json?.error?.code ?? `HTTP_${res.status}`);
    } catch (err) {
      console.error("[quiz] submit gagal:", err);
      setSubmitError(
        "Sepertinya ada gangguan, tapi jawaban kamu aman dan tidak hilang. Silakan coba lagi ya.",
      );
    } finally {
      setSending(false);
    }
  }

  // ---------- Skeleton saat pertanyaan dimuat (Bab 16.2) ----------
  if (phase === "loading") {
    return (
      <section
        className="reveal-up rounded-[1.75rem] border border-line bg-card p-6 sm:p-9"
        aria-busy
      >
        <div className="flex items-center justify-between" aria-hidden>
          <div className="h-3 w-28 animate-pulse rounded-full bg-line/80" />
          <div className="h-3 w-20 animate-pulse rounded-full bg-line/60" />
        </div>
        <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-line/60" aria-hidden />
        <div className="mt-8 h-6 w-4/5 animate-pulse rounded-full bg-line/80" aria-hidden />
        <div className="mt-3 h-6 w-3/5 animate-pulse rounded-full bg-line/60" aria-hidden />
        <div className="mt-8 space-y-3" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-line/50" />
          ))}
        </div>
        <p className="mt-6 flex items-center gap-2 text-sm text-muted">
          <Loader2
            className="h-4 w-4 animate-spin text-accent-deep"
            aria-hidden
          />
          Menyiapkan pertanyaan untukmu…
        </p>
      </section>
    );
  }

  // ---------- Error load pertanyaan + retry (Bab 16.2, 11) ----------
  if (phase === "error") {
    return (
      <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error-tint">
            <WifiOff className="h-7 w-7 text-error" strokeWidth={1.8} aria-hidden />
          </span>
          <h1 className="mt-5 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
            Sepertinya ada gangguan.
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
            Pertanyaan gagal dimuat, tapi jangan khawatir — tidak ada data
            yang hilang. Silakan coba lagi ya.
          </p>
          <button
            type="button"
            onClick={() => void loadQuestions(true)}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
          >
            Muat ulang
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </section>
    );
  }

  // ---------- Status selesai (submit sukses) ----------
  if (phase === "done") {
    return (
      <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-9">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint">
            <CheckCircle2
              className="h-7 w-7 text-accent-deep"
              strokeWidth={1.8}
              aria-hidden
            />
          </span>
          <h1 className="mt-5 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
            Selesai, {firstName(identity.name)}!
          </h1>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
            {type === "NEEDS"
              ? "Jawaban kamu sudah tersimpan. Satu langkah lagi — lihat produk kredit yang paling cocok untukmu."
              : "Jawaban kamu sudah tersimpan. Satu langkah lagi — lihat gambaran kesehatan finansialmu hari ini."}
          </p>
          <button
            type="button"
            onClick={() => router.push(`${resultPath}?id=${submissionId}`)}
            className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
          >
            {type === "NEEDS" ? "Lihat rekomendasi kamu" : "Lihat hasil kamu"}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <p className="mt-4 text-xs text-muted/90">
            Tim cabang bisa menghubungimu lewat WhatsApp setelah ini.
          </p>
        </div>
      </section>
    );
  }

  // ---------- Layar kuis ----------
  const question = questions[index];
  if (!question) return null;

  const total = questions.length;
  const selected = answers[question.questionId] ?? null;
  const isLast = index === total - 1;
  const progressPct = ((index + 1) / total) * 100;

  function renderNavControls() {
    return (
      <div className="flex items-center gap-3">
        {index > 0 && (
          <button
            type="button"
            onClick={goBack}
            disabled={sending}
            aria-label="Kembali ke soal sebelumnya"
            className="flex h-12 shrink-0 items-center gap-1.5 rounded-full border border-line px-5 text-sm font-semibold text-muted transition-colors duration-200 hover:border-accent/40 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Kembali
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!selected || sending}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Menyiapkan hasil…
            </>
          ) : isLast ? (
            <>
              {type === "NEEDS" ? "Lihat rekomendasi" : "Lihat hasil"}
              <Sparkles className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              Lanjut
              <ArrowRight className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <>
      <section
        className="reveal-up rounded-[1.75rem] border border-line bg-card p-6 sm:p-9"
        aria-busy={sending}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
            {eyebrowFor(question, type)}
          </p>
          <p className="shrink-0 text-[11px] font-semibold text-muted">
            Soal {index + 1} dari {total}
          </p>
        </div>
        <div
          className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-label={`Progres kuis: soal ${index + 1} dari ${total}`}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
        >
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* key per soal → animasi transisi masuk (maju/mundur beda arah) */}
        <div key={question.questionId} className={movingBack ? "quiz-in-back mt-7" : "quiz-in mt-7"}>
          <h1 className="font-serif text-[1.5rem] font-semibold leading-snug tracking-tight text-ink sm:text-[1.75rem]">
            {question.text}
          </h1>

          <fieldset className="mt-6">
            <legend className="sr-only">
              Pilih satu jawaban untuk: {question.text}
            </legend>
            <div className="space-y-3">
              {question.options.map((option, i) => {
                const isSelected = selected === option.optionId;
                return (
                  <label
                    key={option.optionId}
                    className={[
                      "group relative flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition-[border-color,background-color] duration-200",
                      "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                      isSelected
                        ? "border-accent bg-accent-tint/70"
                        : "border-line bg-card hover:border-accent/40",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name={`question-${question.questionId}`}
                      value={option.optionId}
                      checked={isSelected}
                      onChange={() => selectOption(option.optionId)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={[
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-200",
                        isSelected
                          ? "bg-accent text-white"
                          : "border border-line bg-paper text-muted",
                      ].join(" ")}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1">
                      <span className="block text-base font-medium leading-snug text-ink">
                        {option.text}
                      </span>
                      {isSelected && option.detail && (
                        <span className="detail-in mt-1.5 block text-[13px] leading-snug text-muted">
                          {option.detail}
                        </span>
                      )}
                    </span>
                    <Check
                      aria-hidden
                      className={[
                        "mt-1 h-5 w-5 shrink-0 transition-colors duration-200",
                        isSelected ? "text-accent" : "text-transparent",
                      ].join(" ")}
                    />
                  </label>
                );
              })}
            </div>
          </fieldset>

          {submitError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-3 rounded-2xl border border-error-line bg-error-tint p-4"
            >
              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-error"
                aria-hidden
              />
              <p className="flex-1 text-sm leading-snug text-error-deep">
                {submitError}
              </p>
            </div>
          )}

          {/* Desktop: tombol inline */}
          <div className="mt-8 hidden sm:flex">{renderNavControls()}</div>
        </div>
      </section>

      {/* Spacer agar konten tidak tertutup bar sticky mobile */}
      <div className="h-24 sm:hidden" aria-hidden />

      {/* Mobile: tombol sticky di bawah (Bab 19) */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur sm:hidden">
        <div className="mx-auto w-full max-w-[600px] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {renderNavControls()}
        </div>
      </div>
    </>
  );
}
