"use client";

import {
  ArrowLeft,
  ArrowRight,
  Car,
  Compass,
  Home,
  Landmark,
  Loader2,
  MessageCircle,
  Sparkles,
  Wallet,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Halaman hasil Financial Needs Assessment (F9, Bab 16.4) + Loading Experience (F12).
// Data diambil dari DB via GET /api/result?id= (Bab 23 — read publik dilarang,
// jadi pakai service-role di server, kunci = submission_id milik sendiri).
// CTA membuka WhatsApp CS secara round-robin (F9, Bab 8.6) via POST /api/cs.
//
// Tampilan mengikuti Bab 16.4 & 8.5:
// - Single recommendation -> 1 produk + alasan singkat.
// - Dual / berimbang -> 2 produk dengan copy "kebutuhanmu terlihat cukup
//   berimbang..." + 2 CTA ("Lihat Pilihan KPR" / "Lihat Pilihan KSM", dst).

type NeedsResultData = {
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: string;
  ksmScore: number;
  kprScore: number;
  kkbScore: number;
};

type FetchData = {
  submissionId: string;
  customerName: string | null;
  assessmentType?: string;
  result: NeedsResultData;
};

// Pesan bertahap F12 — tone "self-discovery" (Bab F12).
const LOADING_MESSAGES = [
  "Menganalisis kebutuhanmu…",
  "Mencocokkan dengan produk yang tersedia…",
  "Menemukan rekomendasi yang paling relevan…",
];

type ProductKey = "KSM" | "KPR" | "KKB";

type ProductMeta = {
  name: string;
  short: string;
  icon: typeof Landmark;
  tagline: string;
  description: string;
  cta: string;
};

const PRODUCTS: Record<ProductKey, ProductMeta> = {
  KSM: {
    name: "Kredit Serbaguna Mandiri",
    short: "KSM",
    icon: Landmark,
    tagline: "Dana fleksibel untuk kebutuhan pribadi & keluarga",
    description:
      "KSM memberi dana tunai yang fleksibel untuk kebutuhan pribadi, keluarga, pendidikan, hingga usaha — dengan cicilan yang bisa disesuaikan.",
    cta: "Lihat Pilihan KSM",
  },
  KPR: {
    name: "Kredit Pemilikan Rumah",
    short: "KPR",
    icon: Home,
    tagline: "Wujudkan rumah pertama atau rumah impianmu",
    description:
      "KPR membantu kamu memiliki rumah pertama, upgrade hunian, atau renovasi — dengan tenor panjang dan angsuran yang terencana.",
    cta: "Lihat Pilihan KPR",
  },
  KKB: {
    name: "Kredit Kendaraan Bermotor",
    short: "KKB",
    icon: Car,
    tagline: "Punya kendaraan baru dengan cicilan ringan",
    description:
      "KKB membantu kamu memiliki motor atau mobil baru — proses mudah dengan pilihan tenor sesuai kebutuhan.",
    cta: "Lihat Pilihan KKB",
  },
};

const CONFIDENCE_COPY: Record<string, string> = {
  STRONG: "Berdasarkan jawabanmu, kebutuhanmu paling cocok dengan produk ini.",
  RECOMMENDATION:
    "Berdasarkan jawabanmu, produk ini paling relevan dengan kebutuhanmu.",
  DUAL: "Dari jawabanmu, kebutuhanmu terlihat cukup berimbang antara dua produk ini.",
};

function productOf(key: string): ProductMeta {
  return PRODUCTS[key as ProductKey] ?? {
    name: key,
    short: key,
    icon: Wallet,
    tagline: "Produk yang relevan untukmu",
    description:
      "Berdasarkan hasil assessmentmu, tim kami siap membantumu menemukan produk yang tepat.",
    cta: `Lihat Pilihan ${key}`,
  };
}

function confidenceCopy(key: string): string {
  return CONFIDENCE_COPY[key] ?? CONFIDENCE_COPY.DUAL;
}

function firstName(full: string | null) {
  if (!full) return "kamu";
  return full.trim().split(/\s+/)[0] ?? "kamu";
}

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

export default function NeedsResultClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [data, setData] = useState<FetchData | null>(null);
  const [error, setError] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [csState, setCsState] = useState<"idle" | "loading">("idle");
  const [csError, setCsError] = useState<string | null>(null);

  // Ambil hasil + jalankan pesan bertahap F12 paralel (Bab F12, 24).
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
        console.error("[needs-result] gagal memuat hasil:", err);
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
      const primary = productOf(r.primaryRecommendation);
      const message = `Halo, saya ${firstName(data.customerName)}. Dari assessment Kebutuhan Kredit, rekomendasi untuk saya: ${primary.name} (${primary.short}). Boleh minta info lebih lanjut?`;
      const url = `https://wa.me/${json.waNumber}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setCsState("idle");
    } catch (err) {
      console.error("[needs-result] membuka WhatsApp gagal:", err);
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
        {phase === "missing" && <MissingCard />}
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

        <p key={step} className="msg-in mt-8 min-h-[1.5rem] font-serif text-lg font-medium text-ink">
          {message}
        </p>
        <p className="mt-2 text-sm text-muted">Tenang, ini hanya sebentar.</p>

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
          href="/financial-needs/quiz"
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

// ---------- Hasil (Bab 16.4) ----------
function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-muted">{value}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.min(100, Math.max(0, value * 3))}%` }}
        />
      </div>
    </div>
  );
}

function ProductCard({
  product,
  highlight,
  onCta,
  csState,
}: {
  product: ProductMeta;
  highlight: boolean;
  onCta: () => void;
  csState: "idle" | "loading";
}) {
  const Icon = product.icon;
  return (
    <section
      className={[
        "reveal-up rounded-[1.75rem] border bg-card p-6 sm:p-8",
        highlight ? "border-accent/60" : "border-line",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <span
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            highlight ? "bg-accent text-white" : "bg-accent-tint text-accent-deep",
          ].join(" ")}
        >
          <Icon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="font-serif text-xl font-semibold leading-tight tracking-tight text-ink">
              {product.name}
            </h2>
            {highlight && (
              <span className="rounded-full bg-accent-tint px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent-deep">
                Rekomendasi utama
              </span>
            )}
          </div>
          <p className="mt-1 text-sm font-medium text-muted">{product.tagline}</p>
        </div>
      </div>

      <p className="mt-4 text-base leading-relaxed text-muted">
        {product.description}
      </p>

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
            {product.cta}
          </>
        )}
      </button>
    </section>
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
  const primary = productOf(r.primaryRecommendation);
  const secondary = r.secondaryRecommendation
    ? productOf(r.secondaryRecommendation)
    : null;
  const isDual = Boolean(secondary);
  const intro = confidenceCopy(r.recommendationConfidence);

  return (
    <div className="space-y-6">
      <p className="reveal-up ad-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
        Hasil kamu · {firstName(data.customerName)}
      </p>

      <section className="reveal-up ad-2 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
          Rekomendasi kredit untukmu
        </p>
        <h1 className="mt-3 font-serif text-2xl font-semibold leading-snug tracking-tight text-ink sm:text-[1.75rem]">
          {isDual
            ? `${primary.short} atau ${secondary?.short}`
            : primary.short}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">{intro}</p>

        <div className="mt-6 space-y-3">
          <ScoreBar label="KSM" value={r.ksmScore} />
          <ScoreBar label="KPR" value={r.kprScore} />
          <ScoreBar label="KKB" value={r.kkbScore} />
        </div>
        <p className="mt-3 text-xs text-muted/80">
          Skor dihitung dari seluruh jawabanmu — makin tinggi, makin relevan.
        </p>
      </section>

      {isDual && secondary ? (
        <>
          <section className="reveal-up ad-3 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-tint text-accent-deep">
                <Sparkles className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </span>
              <div>
                <h2 className="font-serif text-lg font-semibold tracking-tight text-ink">
                  Kebutuhanmu terlihat berimbang
                </h2>
                <p className="mt-0.5 text-sm text-muted">
                  {primary.short} dan {secondary.short} sama-sama relevan.
                  Pilih yang paling sesuai, atau bicara dengan tim kami.
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <ProductCard
              product={primary}
              highlight
              onCta={onCta}
              csState={csState}
            />
            <ProductCard
              product={secondary}
              highlight={false}
              onCta={onCta}
              csState={csState}
            />
          </div>
        </>
      ) : (
        <ProductCard
          product={primary}
          highlight
          onCta={onCta}
          csState={csState}
        />
      )}

      {csError && (
        <p role="alert" className="text-sm font-medium leading-snug text-error">
          {csError}
        </p>
      )}

      <p className="text-center text-xs text-muted/80">
        Tim kami akan menemanimu melangkah lebih lanjut lewat WhatsApp.
      </p>
    </div>
  );
}
