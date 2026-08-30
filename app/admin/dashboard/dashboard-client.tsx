"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RotateCcw,
  Search,
  SearchX,
  SlidersHorizontal,
  WifiOff,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AdminTopBar from "@/app/admin/topbar";
import { AssessmentChip, RecommendationChip } from "@/app/admin/ui/chips";
import {
  displayPhone,
  formatDateTime,
  personaLabel,
} from "@/app/admin/ui/format";
import { useFocusTrap } from "@/lib/utils/focus-trap";

// Dashboard admin — list & filter submission (F10, Bab 16.6 & 18).
// - Data: GET /api/submissions (admin session, filter/search/sort/pagination).
// - Tabel → card list di mobile (Bab 19); filter mobile → bottom sheet.
// - Empty/Loading/Error state lengkap (Bab 16.6, 20).

type AssessmentType = "RATING" | "NEEDS";

interface SubmissionItem {
  submissionId: string;
  customerName: string;
  customerPhone: string;
  assessmentType: string;
  submittedAt: string | null;
  finalScore: number | null;
  persona: string | null;
  readiness: string | null;
  ksmGate: boolean | null;
  ksmScore: number | null;
  kprScore: number | null;
  kkbScore: number | null;
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: string;
}

interface ListResponse {
  items: SubmissionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

type SortMode = "date_desc" | "date_asc" | "score_desc" | "score_asc";

interface Filters {
  q: string;
  type: "ALL" | AssessmentType;
  recommendation: string;
  dateFrom: string;
  dateTo: string;
  sort: SortMode;
}

const DEFAULT_FILTERS: Filters = {
  q: "",
  type: "ALL",
  recommendation: "",
  dateFrom: "",
  dateTo: "",
  sort: "date_desc",
};

const RECOMMENDATION_OPTIONS = [
  { value: "KSM", label: "KSM" },
  { value: "KPR", label: "KPR" },
  { value: "KKB", label: "KKB" },
  { value: "CASA", label: "CASA/Tabungan" },
  { value: "LIVIN", label: "Livin'" },
  { value: "DEBT_ADVICE", label: "Arahan Kelola Utang" },
  { value: "FINANCIAL_ADVICE", label: "Arahan Finansial" },
];

function countActiveFilters(f: Filters): number {
  let n = 0;
  if (f.q.trim()) n += 1;
  if (f.type !== "ALL") n += 1;
  if (f.recommendation) n += 1;
  if (f.dateFrom) n += 1;
  if (f.dateTo) n += 1;
  return n;
}

export default function DashboardClient({ email }: { email: string | null }) {
  const router = useRouter();

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<ListResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  // Kunci fetch terakhir yang SUDAH selesai — loading diturunkan (derived)
  // agar effect tidak perlu setState sinkron di tubuhnya.
  const [completedKey, setCompletedKey] = useState<string | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);

  const activeCount = countActiveFilters(filters);
  const hasActiveFilters = activeCount > 0;

  const fetchKey = JSON.stringify({ filters, page, reloadTick });
  const loading = !failed && completedKey !== fetchKey;

  // Debounce search (Bab 16.6) — pencarian tidak menunggu Enter.
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((prev) =>
        prev.q === searchInput.trim() ? prev : { ...prev, q: searchInput.trim() },
      );
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetch list setiap kali filter/halaman berubah.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.type !== "ALL") params.set("type", filters.type);
      if (filters.recommendation) params.set("recommendation", filters.recommendation);
      if (filters.dateFrom) params.set("date_from", filters.dateFrom);
      if (filters.dateTo) params.set("date_to", filters.dateTo);
      params.set("sort", filters.sort);
      params.set("page", String(page));

      try {
        const res = await fetch(`/api/submissions?${params.toString()}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          // Session habis di tengah aktivitas (Bab 11) → login, kembali ke
          // halaman terakhir setelah masuk.
          router.replace("/admin/login?next=/admin/dashboard&expired=true");
          return;
        }
        const json = (await res.json().catch(() => null)) as
          | (ListResponse & { error?: { code?: string } })
          | null;
        if (!res.ok || !json?.items) {
          console.error("[dashboard] gagal memuat list:", res.status, json?.error);
          throw new Error("load-failed");
        }
        if (cancelled) return;
        setData(json);
        setFailed(false);
        setCompletedKey(fetchKey);
      } catch (err) {
        console.error("[dashboard] gagal memuat list:", err);
        if (!cancelled) {
          setFailed(true);
          setCompletedKey(fetchKey);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, router]);

  // Lock scroll + Escape saat bottom sheet terbuka.
  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  function openSheet() {
    setDraft(filters);
    setSheetOpen(true);
  }

  function applyDraft() {
    setFilters(draft);
    setSearchInput(draft.q);
    setPage(1);
    setSheetOpen(false);
  }

  function resetAll() {
    setFilters(DEFAULT_FILTERS);
    setSearchInput("");
    setPage(1);
  }

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageStart = total === 0 ? 0 : (page - 1) * (data?.limit ?? 20) + 1;
  const pageEnd = Math.min(page * (data?.limit ?? 20), total);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-paper font-sans text-ink">
      <Background />
      <AdminTopBar email={email} title="Dashboard Admin" />

      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-10">
        {/* Heading */}
        <div className="reveal-up">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span className="h-px w-8 bg-accent/50" aria-hidden />
            Dashboard
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h1 className="font-serif text-[2rem] leading-tight tracking-tight text-ink sm:text-4xl">
                Submission nasabah
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-muted">
                Semua hasil assessment untuk follow-up cabang. Klik baris
                untuk melihat detail lengkap.
              </p>
            </div>
            {!loading && !failed && (
              <p
                aria-live="polite"
                className="rounded-full border border-line bg-card px-4 py-2 text-sm font-medium text-muted"
              >
                {total} submission
              </p>
            )}
          </div>
        </div>

        {/* Filter bar */}
        <section className="reveal-up ad-1 mt-7 rounded-[1.75rem] border border-line bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted"
                aria-hidden
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari nama atau nomor HP…"
                aria-label="Cari nama atau nomor HP"
                className="h-12 w-full rounded-2xl border border-line bg-paper/70 pl-11 pr-4 text-base text-ink placeholder:text-muted/50 transition-[border-color,box-shadow] duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
              />
            </div>

            {/* Mobile: tombol buka bottom sheet (Bab 19) */}
            <button
              type="button"
              onClick={openSheet}
              className="relative flex h-12 items-center justify-center gap-2 rounded-2xl border border-line bg-paper/70 px-5 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:text-accent-deep md:hidden"
              aria-label={
                activeCount > 0
                  ? `Buka filter, ${activeCount} filter aktif`
                  : "Buka filter"
              }
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" aria-hidden />
              Filter
              {activeCount > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-white"
                >
                  {activeCount}
                </span>
              )}
            </button>

            {/* Desktop: filter inline */}
            <div className="hidden flex-wrap items-end gap-3 md:flex">
              <FilterSelect
                label="Jenis"
                value={filters.type}
                onChange={(v) => {
                  setFilters((f) => ({ ...f, type: v as Filters["type"] }));
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "Semua" },
                  { value: "RATING", label: "Financial Health" },
                  { value: "NEEDS", label: "Kebutuhan Kredit" },
                ]}
              />
              <FilterSelect
                label="Rekomendasi"
                value={filters.recommendation}
                onChange={(v) => {
                  setFilters((f) => ({ ...f, recommendation: v }));
                  setPage(1);
                }}
                options={[
                  { value: "", label: "Semua" },
                  ...RECOMMENDATION_OPTIONS,
                ]}
              />
              <FilterDate
                label="Dari"
                value={filters.dateFrom}
                onChange={(v) => {
                  setFilters((f) => ({ ...f, dateFrom: v }));
                  setPage(1);
                }}
              />
              <FilterDate
                label="Sampai"
                value={filters.dateTo}
                onChange={(v) => {
                  setFilters((f) => ({ ...f, dateTo: v }));
                  setPage(1);
                }}
              />
              <FilterSelect
                label="Urutkan"
                value={filters.sort}
                onChange={(v) => {
                  setFilters((f) => ({ ...f, sort: v as SortMode }));
                  setPage(1);
                }}
                options={[
                  { value: "date_desc", label: "Terbaru" },
                  { value: "date_asc", label: "Terlama" },
                  { value: "score_desc", label: "Skor tertinggi" },
                  { value: "score_asc", label: "Skor terendah" },
                ]}
              />
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAll}
                  className="flex h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:text-error"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  Reset
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Konten */}
        <section
          className={`reveal-up ad-2 mt-5 ${
            loading && data ? "pointer-events-none opacity-60" : ""
          }`}
          aria-busy={loading}
        >
          {failed ? (
            <ErrorState
              onRetry={() => {
                setFailed(false);
                setCompletedKey(null);
                setReloadTick((t) => t + 1);
              }}
            />
          ) : loading && !data ? (
            <TableSkeleton />
          ) : total === 0 ? (
            <EmptyState hasActiveFilters={hasActiveFilters} onReset={resetAll} />
          ) : (
            <>
              <ResultsTable
                items={items}
                onOpen={(id) => router.push(`/admin/submission/${id}`)}
              />
              <Pagination
                page={data?.page ?? 1}
                totalPages={data?.totalPages ?? 1}
                pageStart={pageStart}
                pageEnd={pageEnd}
                total={total}
                onPage={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </section>
      </main>

      {sheetOpen && (
        <FilterSheet
          draft={draft}
          onDraft={setDraft}
          onApply={applyDraft}
          onReset={() => setDraft(DEFAULT_FILTERS)}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

// ---------- Filter controls (dipakai desktop & sheet) ----------

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 max-w-[190px] rounded-xl border border-line bg-paper/70 px-3 text-sm font-medium text-ink transition-[border-color,box-shadow] duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilterDate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        <CalendarDays className="h-3 w-3" aria-hidden />
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border border-line bg-paper/70 px-3 text-sm font-medium text-ink transition-[border-color,box-shadow] duration-200 focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/15"
      />
    </label>
  );
}

// ---------- Bottom sheet filter (mobile, Bab 19) ----------

function FilterSheet({
  draft,
  onDraft,
  onApply,
  onReset,
  onClose,
}: {
  draft: Filters;
  onDraft: (f: Filters) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, true);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center sm:p-6">
      <button
        type="button"
        aria-label="Tutup filter"
        onClick={onClose}
        className="backdrop-in absolute inset-0 bg-ink/45"
        tabIndex={-1}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-sheet-title"
        tabIndex={-1}
        className="sheet-in relative z-10 flex max-h-[88dvh] w-full flex-col rounded-t-[1.75rem] border-t border-line bg-card p-6 outline-none sm:max-w-md sm:rounded-[1.75rem] sm:border"
      >
        <div className="flex items-center justify-between">
          <h2
            id="filter-sheet-title"
            className="font-serif text-xl font-semibold tracking-tight text-ink"
          >
            Filter submission
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted transition-colors hover:text-ink"
            aria-label="Tutup"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-5 flex-1 space-y-4 overflow-y-auto pb-2">
          <FilterSelect
            label="Jenis assessment"
            value={draft.type}
            onChange={(v) => onDraft({ ...draft, type: v as Filters["type"] })}
            options={[
              { value: "ALL", label: "Semua" },
              { value: "RATING", label: "Financial Health" },
              { value: "NEEDS", label: "Kebutuhan Kredit" },
            ]}
          />
          <FilterSelect
            label="Rekomendasi"
            value={draft.recommendation}
            onChange={(v) => onDraft({ ...draft, recommendation: v })}
            options={[{ value: "", label: "Semua" }, ...RECOMMENDATION_OPTIONS]}
          />
          <div className="grid grid-cols-2 gap-3">
            <FilterDate
              label="Dari"
              value={draft.dateFrom}
              onChange={(v) => onDraft({ ...draft, dateFrom: v })}
            />
            <FilterDate
              label="Sampai"
              value={draft.dateTo}
              onChange={(v) => onDraft({ ...draft, dateTo: v })}
            />
          </div>
          <FilterSelect
            label="Urutkan"
            value={draft.sort}
            onChange={(v) => onDraft({ ...draft, sort: v as SortMode })}
            options={[
              { value: "date_desc", label: "Terbaru" },
              { value: "date_asc", label: "Terlama" },
              { value: "score_desc", label: "Skor tertinggi" },
              { value: "score_asc", label: "Skor terendah" },
            ]}
          />
        </div>

        <div className="mt-5 flex gap-3 border-t border-line pt-5">
          <button
            type="button"
            onClick={onReset}
            className="flex h-12 items-center justify-center gap-1.5 rounded-full border border-line px-5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Bersihkan
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex h-12 flex-1 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.99]"
          >
            Terapkan filter
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Hasil: tabel (md+) & card list (mobile) ----------

function SummaryBlock({ item }: { item: SubmissionItem }) {
  if (item.assessmentType === "RATING") {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-lg font-semibold tracking-tight text-ink">
            {personaLabel(item.persona)}
          </span>
          <span className="text-sm font-semibold text-muted">
            {item.finalScore ?? "—"}
            <span className="text-xs font-medium text-muted/90">/100</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <RecommendationChip
            primary={item.primaryRecommendation}
            secondary={item.secondaryRecommendation}
          />
          {item.ksmGate === true && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-strong-tint px-2.5 py-1 text-[11px] font-semibold text-strong">
              Siap KSM
            </span>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <RecommendationChip
        primary={item.primaryRecommendation}
        secondary={item.secondaryRecommendation}
      />
      <p className="text-xs font-medium text-muted">
        KSM {item.ksmScore ?? 0} · KPR {item.kprScore ?? 0} · KKB {item.kkbScore ?? 0}
      </p>
    </div>
  );
}

function ResultsTable({
  items,
  onOpen,
}: {
  items: SubmissionItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <>
      {/* Desktop / tablet: tabel (Bab 16.6, 19) */}
      <div className="hidden overflow-hidden rounded-[1.75rem] border border-line bg-card md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-line bg-paper/60">
              <th scope="col" className="px-6 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Nama / Kontak
              </th>
              <th scope="col" className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Jenis
              </th>
              <th scope="col" className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Tanggal Submit
              </th>
              <th scope="col" className="px-4 py-4 text-[11px] font-semibold uppercase tracking-wide text-muted">
                Hasil Ringkas
              </th>
              <th scope="col" className="w-12 px-4 py-4" aria-hidden>
                <span className="sr-only">Detail</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.submissionId}
                onClick={() => onOpen(item.submissionId)}
                className="group cursor-pointer border-b border-line/70 transition-colors duration-150 last:border-b-0 hover:bg-paper/60"
              >
                <th scope="row" className="relative px-6 py-4 font-normal">
                  <Link
                    href={`/admin/submission/${item.submissionId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute inset-0 z-10"
                    aria-label={`Lihat detail submission ${item.customerName}`}
                  />
                  <span className="pointer-events-none block text-[15px] font-semibold text-ink">
                    {item.customerName}
                  </span>
                  <span className="pointer-events-none mt-0.5 block text-sm text-muted">
                    {displayPhone(item.customerPhone)}
                  </span>
                </th>
                <td className="px-4 py-4">
                  <AssessmentChip type={item.assessmentType} withIcon />
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-ink">
                  {formatDateTime(item.submittedAt)}
                </td>
                <td className="px-4 py-4">
                  <SummaryBlock item={item} />
                </td>
                <td className="px-4 py-4">
                  <ChevronRight
                    className="h-4 w-4 text-muted/60 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: card list (Bab 19 — bukan tabel scroll horizontal) */}
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item.submissionId}>
            <Link
              href={`/admin/submission/${item.submissionId}`}
              className="block rounded-[1.5rem] border border-line bg-card p-5 transition-[transform,box-shadow,border-color] duration-200 active:scale-[0.99] hover:border-accent/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-ink">
                    {item.customerName}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    {displayPhone(item.customerPhone)}
                  </p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted/60" aria-hidden />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <AssessmentChip type={item.assessmentType} />
                <span className="text-xs font-medium text-muted">
                  {formatDateTime(item.submittedAt)}
                </span>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <SummaryBlock item={item} />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

// ---------- Pagination (Bab 18: 20–25 baris/halaman) ----------

function Pagination({
  page,
  totalPages,
  pageStart,
  pageEnd,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  pageStart: number;
  pageEnd: number;
  total: number;
  onPage: (page: number) => void;
}) {
  return (
    <nav
      aria-label="Navigasi halaman"
      className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm font-medium text-muted">
        Menampilkan {pageStart}–{pageEnd} dari {total} submission
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="flex h-11 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-semibold text-ink transition-all duration-200 hover:border-accent hover:text-accent-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Sebelumnya
        </button>
        <span className="min-w-[5.5rem] text-center text-sm font-semibold text-muted">
          Halaman {page} dari {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="flex h-11 items-center gap-1.5 rounded-full border border-line bg-card px-4 text-sm font-semibold text-ink transition-all duration-200 hover:border-accent hover:text-accent-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </nav>
  );
}

// ---------- Skeleton / Empty / Error ----------

function TableSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[1.75rem] border border-line bg-card"
      aria-label="Memuat data submission"
    >
      <div className="hidden border-b border-line bg-paper/60 px-6 py-4 md:block">
        <div className="h-3.5 w-40 animate-pulse rounded-full bg-line" />
      </div>
      <ul className="divide-y divide-line/70">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-4.5 sm:px-6">
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-44 animate-pulse rounded-full bg-line" />
              <div className="h-3 w-28 animate-pulse rounded-full bg-line/70" />
            </div>
            <div className="hidden h-6 w-28 animate-pulse rounded-full bg-line sm:block" />
            <div className="hidden h-3.5 w-32 animate-pulse rounded-full bg-line md:block" />
            <div className="h-6 w-36 animate-pulse rounded-full bg-line/80" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function EmptyState({
  hasActiveFilters,
  onReset,
}: {
  hasActiveFilters: boolean;
  onReset: () => void;
}) {
  const Icon = hasActiveFilters ? SearchX : Inbox;
  return (
    <div className="rounded-[1.75rem] border border-line bg-card p-7 sm:p-10">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint text-accent-deep">
          <Icon className="h-7 w-7" strokeWidth={1.8} aria-hidden />
        </span>
        <h2 className="mt-5 font-serif text-[1.5rem] font-semibold leading-tight tracking-tight text-ink">
          {hasActiveFilters ? "Tidak ada hasil yang cocok" : "Belum ada data submission"}
        </h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
          {hasActiveFilters
            ? "Coba ubah kata kunci pencarian atau longgarkan filter-nya ya."
            : "Submission nasabah akan tampil di sini setelah mereka menyelesaikan assessment."}
        </p>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="mt-7 flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Bersihkan filter
          </button>
        )}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[1.75rem] border border-line bg-card p-7 sm:p-10">
      <div className="flex flex-col items-center py-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-error-tint">
          <WifiOff className="h-7 w-7 text-error" strokeWidth={1.8} aria-hidden />
        </span>
        <h2 className="mt-5 font-serif text-[1.5rem] font-semibold leading-tight tracking-tight text-ink">
          Sepertinya ada gangguan.
        </h2>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">
          Data gagal dimuat, tapi jangan khawatir — datanya aman. Silakan coba
          lagi ya.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-7 flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}

// ---------- Latar ambient (konsisten dgn halaman nasabah) ----------

function Background() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-dots absolute inset-x-0 top-0 h-[420px]" />
      <div className="glow absolute -top-32 right-[-12%] h-[440px] w-[440px] rounded-full" />
    </div>
  );
}
