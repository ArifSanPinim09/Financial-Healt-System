"use client";

import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Loader2,
  MessageCircle,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Halaman hasil Financial Health Score (F6, Bab 16.3) + Loading Experience (F12).
// Data diambil dari DB via GET /api/result?id= (Bab 23 — read publik dilarang,
// jadi pakai service-role di server, kunci = submission_id milik sendiri).
// CTA membuka WhatsApp CS secara round-robin (F6, Bab 8.6) via POST /api/cs.

type Dimension = {
  dimension: string;
  label: string;
  rawScore: number;
  contribution: number;
  status: "STRONG" | "GOOD" | "IMPROVE" | "PRIORITY";
};

type ResultData = {
  finalScore: number;
  persona: string;
  readiness: string;
  ksmGate: boolean;
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: string;
  financialGoal: string | null;
  financialNeed: string | null;
  dimensions: Dimension[];
};

type FetchData = {
  submissionId: string;
  customerName: string | null;
  result: ResultData;
};

// Pesan bertahap F12 — tone "self-discovery", bukan "menghitung skor" (Bab F12).
const LOADING_MESSAGES = [
  "Menganalisis kebiasaan finansialmu…",
  "Mempelajari pola finansialmu…",
  "Menemukan profil finansialmu…",
];

const PERSONA_COPY: Record<string, { name: string; description: string }> = {
  THE_ARCHITECT: {
    name: "The Architect",
    description:
      "Fondasi finansial yang kuat dengan perencanaan masa depan yang jelas.",
  },
  THE_BUILDER: {
    name: "The Builder",
    description:
      "Fondasi finansial yang solid dan sedang aktif membangun menuju tujuan berikutnya.",
  },
  THE_EXPLORER: {
    name: "The Explorer",
    description:
      "Sudah di jalur yang tepat, tapi masih ada beberapa area untuk ditingkatkan.",
  },
  THE_ADVENTURER: {
    name: "The Adventurer",
    description:
      "Fleksibel, tapi butuh struktur finansial yang lebih rapi untuk melangkah lebih jauh.",
  },
  THE_STARTER: {
    name: "The Starter",
    description:
      "Mulai membangun fondasi finansial yang lebih sehat — dan itu langkah yang tepat.",
  },
};

// Status dimensi (Bab 8.1) + warna semantik konsisten (Bab 20).
const STATUS_COPY: Record<
  Dimension["status"],
  { label: string; pill: string; bar: string }
> = {
  STRONG: {
    label: "Kuat",
    pill: "bg-strong-tint text-strong",
    bar: "bg-strong",
  },
  GOOD: {
    label: "Baik",
    pill: "bg-good-tint text-good",
    bar: "bg-good",
  },
  IMPROVE: {
    label: "Perbaiki",
    pill: "bg-improve-tint text-improve",
    bar: "bg-improve",
  },
  PRIORITY: {
    label: "Prioritas",
    pill: "bg-priority-tint text-priority",
    bar: "bg-priority",
  },
};

// Copy "Your Next Move" per jalur rekomendasi (Bab 8.3, doc Bab 17).
const RECOMMENDATION_COPY: Record<
  string,
  { headline: string; body: string; cta: string }
> = {
  KSM: {
    headline: "Siap melangkah ke tujuan finansial berikutnya",
    body: "Fondasi finansialmu cukup kuat untuk mulai mengeksplorasi tujuan finansial berikutnya. KSM bisa jadi pilihan yang relevan untukmu.",
    cta: "Jelajahi KSM",
  },
  DEBT_ADVICE: {
    headline: "Fokus berikutmu: kelola utang",
    body: "Fondasi finansialmu cukup baik, tapi menata komitmen utang saat ini bisa jadi prioritas berikutmu. Mulai dari sini dulu sebelum melangkah ke produk berikutnya.",
    cta: "Bicara soal utang",
  },
  LIVIN: {
    headline: "Fokus berikutmu: arus kas harian",
    body: "Mengelola uang masuk–keluar harian adalah fondasi penting. Dengan Livin', kamu bisa lebih mudah memantau dan mengatur cash flow sehari-hari.",
    cta: "Coba Livin'",
  },
  CASA: {
    headline: "Fokus berikutmu: dana darurat & tabungan",
    body: "Membangun bantalan dana darurat dan kebiasaan menabung akan membuat setiap langkah finansialmu berikutnya terasa lebih aman dan nyaman.",
    cta: "Lihat opsi tabungan",
  },
  FINANCIAL_ADVICE: {
    headline: "Fokus berikutmu: fondasi finansial",
    body: "Ada beberapa area yang perlu ditata bersama-sama. Daripada langsung memilih produk tertentu, yuk mulai dari memahami peta finansialmu — tim kami siap menemani.",
    cta: "Terima petunjuk finansial",
  },
};

function personaOf(key: string) {
  if (PERSONA_COPY[key]) return PERSONA_COPY[key];
  return {
    name: key ? key.replace(/_/g, " ") : "Profil Finansialmu",
    description:
      "Ini gambaran kondisi finansialmu hari ini. Yuk pelajari langkah berikutmu.",
  };
}

function recommendationOf(key: string) {
  return (
    RECOMMENDATION_COPY[key] ?? {
      headline: "Langkah berikutmu",
      body: "Berdasarkan hasil assessmentmu, tim kami punya beberapa rekomendasi untuk melangkah berikutnya.",
      cta: "Bicara dengan tim kami",
    }
  );
}

function firstName(full: string | null) {
  if (!full) return "kamu";
  return full.trim().split(/\s+/)[0] ?? "kamu";
}

function clampPct(n: number) {
  return Math.min(100, Math.max(0, n));
}

const RING_SIZE = 156;
const RING_STROKE = 12;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

function Header() {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex w-full max-w-[640px] items-center justify-between px-5 py-5 sm:px-6 sm:py-7">
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
  );
}

function Background() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-dots absolute inset-x-0 top-0 h-[560px]" />
      <div className="glow absolute -top-32 right-[-12%] h-[480px] w-[480px] rounded-full" />
    </div>
  );
}

export default function ResultClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [data, setData] = useState<FetchData | null>(null);
  const [error, setError] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [csState, setCsState] = useState<"idle" | "loading">("idle");
  const [csError, setCsError] = useState<string | null>(null);

  // Ambil hasil + jalankan pesan bertahap F12 paralel (Bab F12, 24: beberapa detik).
  // Effect boleh re-run (React StrictMode di dev) — fetch idempoten (GET) dan
  // timer dijadwalkan ulang di run terakhir, jadi aman tanpa guard.
  useEffect(() => {
    if (!id) return;
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`/api/result?id=${encodeURIComponent(id)}`);
        const json = (await res.json().catch(() => null)) as
          | (FetchData & { error?: { code?: string } })
          | null;
        if (!res.ok || !json?.result) throw new Error("bad-result");
        if (mounted) setData(json);
      } catch (err) {
        console.error("[result] gagal memuat hasil:", err);
        if (mounted) setError(true);
      }
    })();

    const t1 = window.setTimeout(() => mounted && setMsgIndex(1), 1050);
    const t2 = window.setTimeout(() => mounted && setMsgIndex(2), 2100);
    const t3 = window.setTimeout(() => mounted && setAnimDone(true), 3150);
    return () => {
      mounted = false;
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [id]);

  const isResult = Boolean(id) && animDone && data !== null;

  async function openWhatsApp() {
    if (csState === "loading" || !data) return;
    setCsState("loading");
    setCsError(null);
    try {
      const res = await fetch("/api/cs", { method: "POST" });
      const json = (await res.json().catch(() => null)) as
        | { waNumber?: string; error?: { code?: string } }
        | null;
      if (!res.ok || !json?.waNumber) throw new Error("no-cs");
      const r = data.result;
      const rec = recommendationOf(r.primaryRecommendation);
      const personaName = personaOf(r.persona).name;
      const message = `Halo, saya ${firstName(data.customerName)}. Hasil Financial Health Score saya ${r.finalScore}/100 (${personaName}). Rekomendasi untuk saya: ${rec.cta}. Boleh minta tahu lebih lanjut?`;
      const url = `https://wa.me/${json.waNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setCsState("idle");
    } catch (err) {
      console.error("[result] membuka WhatsApp gagal:", err);
      setCsError(
        "Sepertinya WhatsApp tidak terbuka. Silakan coba lagi ya — atau tim kami juga bisa menghubungimu.",
      );
      setCsState("idle");
    }
  }

  const phase: "missing" | "error" | "loading" | "result" = !id
    ? "missing"
    : error
      ? "error"
      : isResult
        ? "result"
        : "loading";

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-paper font-sans text-ink">
      <Background />
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-[640px] flex-1 px-5 pb-20 sm:px-6">
        {phase === "missing" && (
          <MissingCard />
        )}
        {phase === "error" && <ErrorCard onRetry={() => window.location.reload()} />}
        {phase === "loading" && <LoadingCard step={msgIndex} />}

        {phase === "result" && data && (
          <ResultView
            data={data}
            onCta={() => void openWhatsApp()}
            csState={csState}
            csError={csError}
          />
        )}
      </main>
    </div>
  );
}

// ---------- Loading experience bertahap (F12) ----------
function LoadingCard({ step }: { step: number }) {
  const message = LOADING_MESSAGES[Math.min(step, LOADING_MESSAGES.length - 1)];
  return (
    <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-10">
      <div className="flex flex-col items-center py-10 text-center">
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="ring-breathe absolute inset-0 rounded-full bg-accent-tint" aria-hidden />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Compass className="soft-pulse h-7 w-7 text-white" strokeWidth={1.8} aria-hidden />
          </span>
        </div>

        {/* key per pesan → animasi swap masuk */}
        <p key={step} className="msg-in mt-8 min-h-[1.5rem] font-serif text-lg font-medium text-ink">
          {message}
        </p>
        <p className="mt-2 text-sm text-muted">
          Tenang, ini hanya sebentar.
        </p>

        <div className="mt-8 flex gap-2" aria-hidden>
          {LOADING_MESSAGES.map((_, i) => (
            <span
              key={i}
              className={[
                "h-1.5 rounded-full transition-all duration-500",
                i <= step ? "w-8 bg-accent" : "w-4 bg-line",
              ].join(" ")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function MissingCard() {
  return (
    <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-10">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint text-accent-deep">
          <Compass className="h-7 w-7" strokeWidth={1.8} aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
          Belum ada hasil di sini.
        </h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
          Sepertinya kamu belum menyelesaikan assessment ini. Yuk mulai dulu,
          lalu hasilnya akan tampil di halaman ini.
        </p>
        <Link
          href="/financial-health/quiz"
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
        >
          Mulai assessment
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </section>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-10">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error-tint">
          <WifiOff className="h-7 w-7 text-error" strokeWidth={1.8} aria-hidden />
        </span>
        <h1 className="mt-5 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
          Sepertinya ada gangguan.
        </h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
          Hasilmu gagal dimuat, tapi datamu aman dan tidak hilang. Silakan coba
          lagi ya.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
        >
          Coba lagi
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </section>
  );
}

// ---------- Hasil (Bab 16.3) ----------
function ScoreRing({ score }: { score: number }) {
  // Animasi "cincin terisi" dari 0 → skor, dijalankan saat komponen mount.
  // setState hanya di callback timeout (bukan sinkron di effect).
  const [sweep, setSweep] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setSweep(clampPct(score)), 120);
    return () => clearTimeout(t);
  }, [score]);

  const offset = RING_C * (1 - sweep / 100);
  return (
    <div className="relative h-[156px] w-[156px]" aria-hidden>
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="-rotate-90"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke="var(--line)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_R}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_C}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-serif text-5xl font-semibold leading-none tracking-tight text-ink">
          {score}
        </span>
        <span className="mt-1 text-sm font-medium text-muted">/ 100</span>
      </div>
    </div>
  );
}

function DimensionCard({ dim }: { dim: Dimension }) {
  const s = STATUS_COPY[dim.status] ?? STATUS_COPY.IMPROVE;
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted">
          {dim.label}
        </span>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.pill}`}
        >
          {s.label}
        </span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${dim.label}: ${dim.rawScore} dari 100, status ${s.label}`}
      >
        <div
          className={`h-full rounded-full ${s.bar}`}
          style={{ width: `${clampPct(dim.rawScore)}%` }}
        />
      </div>
    </div>
  );
}

function ResultView({
  data,
  onCta,
  csState,
  csError,
}: {
  data: FetchData;
  onCta: () => void;
  csState: "idle" | "loading";
  csError: string | null;
}) {
  const r = data.result;
  const persona = personaOf(r.persona);
  const rec = recommendationOf(r.primaryRecommendation);
  const sortedDims = [...r.dimensions].sort((a, b) => b.rawScore - a.rawScore);

  return (
    <div className="space-y-6">
      <p className="reveal-up ad-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
        Hasil kamu · {firstName(data.customerName)}
      </p>

      {/* Mobile: stack · Desktop: skor+persona kiri, grid dimensi kanan */}
      <div className="grid items-start gap-6 md:grid-cols-2 md:gap-8">
        <section className="reveal-up ad-2 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <ScoreRing score={r.finalScore} />
            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-tint px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent-deep">
              <Compass className="h-3.5 w-3.5" aria-hidden />
              {persona.name}
            </span>
            <p className="mt-3 text-base leading-relaxed text-ink">
              {persona.description}
            </p>
          </div>
        </section>

        <section className="reveal-up ad-3 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
            Profil finansialmu
          </h2>
          <p className="mt-1 text-sm text-muted">
            Enam area yang membentuk skor kamu hari ini.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {sortedDims.map((dim) => (
              <DimensionCard key={dim.dimension} dim={dim} />
            ))}
          </div>
        </section>
      </div>

      {/* Your Next Move (Bab 16.3) */}
      <section className="reveal-up ad-4 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
          Your next move
        </p>
        <h2 className="mt-3 font-serif text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.75rem]">
          {rec.headline}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted">{rec.body}</p>

        {r.financialGoal && (
          <p className="mt-4 rounded-2xl bg-paper/70 px-4 py-3 text-sm leading-snug text-ink">
            Dengan tujuanmu <span className="font-semibold">{r.financialGoal}</span>,
            langkah ini makin relevan untukmu.
          </p>
        )}

        <button
          type="button"
          onClick={onCta}
          disabled={csState === "loading"}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {csState === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Menyiapkan…
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4" aria-hidden />
              {rec.cta}
            </>
          )}
        </button>

        {csError && (
          <p role="alert" className="mt-3 text-sm font-medium leading-snug text-error">
            {csError}
          </p>
        )}

        <p className="mt-4 text-xs text-muted/80">
          Tim kami akan menemanimu melangkah lebih lanjut lewat WhatsApp.
        </p>
      </section>
    </div>
  );
}
