import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Clock,
  Compass,
  FileQuestion,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

type Assessment = {
  href: string;
  index: string;
  icon: LucideIcon;
  kicker: string;
  title: string;
  description: string;
  meta: [string, string];
};

const assessments: Assessment[] = [
  {
    href: "/financial-health/quiz",
    index: "01",
    icon: Gauge,
    kicker: "Financial Rating",
    title: "Financial Health Score",
    description:
      "Ukur kesehatan finansialmu di 6 dimensi. Dapatkan skor 0–100, persona, dan rekomendasi langkah berikutnya.",
    meta: ["14 pertanyaan", "±5 menit"],
  },
  {
    href: "/financial-needs/quiz",
    index: "02",
    icon: Compass,
    kicker: "Financial Needs",
    title: "Kebutuhan Kredit",
    description:
      "Jawab 10 pertanyaan tentang kebutuhanmu, lalu temukan produk kredit yang paling relevan — KSM, KPR, atau KKB.",
    meta: ["10 pertanyaan", "±3 menit"],
  },
];

const trustSignals: { icon: LucideIcon; label: string }[] = [
  { icon: Clock, label: "±5 menit" },
  { icon: FileQuestion, label: "10–14 pertanyaan" },
  { icon: ShieldCheck, label: "Tanpa login" },
];

function AssessmentCard({
  href,
  index,
  icon: Icon,
  kicker,
  title,
  description,
  meta,
}: Assessment) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-8 rounded-[1.75rem] border border-line bg-card p-7 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1.5 hover:border-accent/50 hover:shadow-[0_24px_48px_-24px_rgba(10,86,72,0.4)] md:p-9"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-tint text-accent-deep transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105">
          <Icon className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
        </span>
        <span
          className="font-serif text-lg italic text-muted/90"
          aria-hidden
        >
          {index}
        </span>
      </div>

      <div className="flex flex-1 flex-col">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
          {kicker}
        </p>
        <h2 className="mt-2.5 font-serif text-2xl font-semibold tracking-tight text-ink md:text-[1.65rem]">
          {title}
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted">
          {description}
        </p>
        <div className="mt-5 flex items-center gap-2.5 text-[13px] font-medium text-muted">
          <span>{meta[0]}</span>
          <span className="h-1 w-1 rounded-full bg-line" aria-hidden />
          <span>{meta[1]}</span>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-line pt-5">
        <span className="relative text-sm font-semibold text-ink">
          Mulai assessment
          <span
            className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-accent transition-transform duration-300 ease-out group-hover:scale-x-100"
            aria-hidden
          />
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-paper text-ink transition-colors duration-300 ease-out group-hover:border-accent group-hover:bg-accent group-hover:text-white">
          <ArrowRight
            className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-paper font-sans text-ink">
      {/* Latar ambient: dot grid + glow teal yang bergerak pelan */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="bg-dots absolute inset-x-0 top-0 h-[640px]" />
        <div className="glow absolute -top-32 right-[-12%] h-[520px] w-[520px] rounded-full" />
      </div>

      <header className="relative z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8 sm:py-7">
          <Link
            href="/"
            className="reveal-up ad-1 -mx-3 flex items-baseline gap-3 rounded-xl px-3 py-2"
            aria-label="Beranda Livin' Financial Wellness"
          >
            <span className="font-serif text-[1.7rem] font-semibold tracking-tight text-ink">
              Livin<span className="text-accent">&rsquo;</span>
            </span>
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:block">
              Financial Wellness
            </span>
          </Link>
          <span className="reveal-up ad-2 inline-flex items-center gap-2 rounded-full border border-line bg-card/80 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-50 motion-safe:animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Demo
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 sm:px-8">
        <section className="max-w-2xl pt-12 sm:pt-16 md:pt-24">
          <p className="reveal-up ad-1 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span className="h-px w-8 bg-accent/50" aria-hidden />
            Asesmen Finansial
          </p>

          <h1 className="mt-5 font-serif text-[2.6rem] leading-[1.06] tracking-[-0.02em] text-ink sm:text-6xl lg:text-[4.25rem]">
            <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
              <span className="reveal-line ad-2 block">Kenali kondisi</span>
            </span>
            <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
              <span className="reveal-line ad-3 block">
                finansialmu, temukan
              </span>
            </span>
            <span className="-mb-[0.12em] block overflow-hidden pb-[0.12em]">
              <span className="reveal-line ad-4 block">
                <em className="font-medium italic text-accent-deep">
                  langkah berikutnya.
                </em>
              </span>
            </span>
          </h1>

          <p className="reveal-up ad-4 mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            Jawab beberapa pertanyaan singkat tentang kebiasaan finansialmu.
            Hasilnya — gambaran yang jujur tentang kondisi keuanganmu, plus
            rekomendasi yang paling relevan. Tanpa login, tanpa terasa seperti
            ujian.
          </p>

          <ul className="reveal-up ad-5 mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm text-muted">
            {trustSignals.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon
                  className="h-4 w-4 text-accent-deep"
                  strokeWidth={2}
                  aria-hidden
                />
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="pt-10 pb-16 sm:pt-14 sm:pb-24 md:pb-28"
          aria-label="Pilih assessment"
        >
          <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
            <div className="reveal-up ad-5">
              <AssessmentCard {...assessments[0]} />
            </div>
            <div className="reveal-up ad-6 md:mt-12">
              <AssessmentCard {...assessments[1]} />
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 mt-auto bg-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-xl font-semibold text-paper">
              Livin<span className="text-accent">&rsquo;</span>
            </span>
            <span className="hidden h-4 w-px bg-paper/20 sm:block" aria-hidden />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-paper/50 sm:block">
              Financial Wellness
            </span>
          </div>
          <p className="max-w-md text-xs leading-relaxed text-paper/55">
            Aplikasi demo untuk keperluan business case — bukan bagian dari
            sistem resmi bank mana pun.
          </p>
        </div>
      </footer>
    </div>
  );
}
