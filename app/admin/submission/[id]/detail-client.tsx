"use client";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Clock,
  History,
  Loader2,
  Pencil,
  SearchX,
  Trash2,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminTopBar from "@/app/admin/topbar";
import ConfirmModal from "@/app/admin/confirm-modal";
import { AssessmentChip, RecommendationChip } from "@/app/admin/ui/chips";
import {
  displayPhone,
  formatDateTime,
  personaLabel,
} from "@/app/admin/ui/format";
import { Toast, useToast } from "@/app/admin/toast";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";

// Detail submission admin (F10, Bab 16.7, 25).
// - View: info nasabah, hasil ringkas, detail jawaban (accordion), audit log.
// - Edit: ubah nama/no HP/jawaban -> skor dihitung ulang server (Bab 24).
// - Hapus: modal konfirmasi -> soft-delete + audit log.
// - Toast "Perubahan disimpan" / "Data berhasil dihapus" (Bab 16.7).

interface QuestionOption {
  optionId: string;
  optionText: string;
  optionDetail: string | null;
}

interface Question {
  questionId: string;
  questionText: string;
  dimension: string | null;
  orderIndex: number;
  isScoring: boolean;
  options: QuestionOption[];
}

interface Dimension {
  dimension: string;
  label: string;
  rawScore: number;
  contribution: number;
  status: string;
}

interface AuditEntry {
  id: string;
  action: string;
  adminId: string;
  adminEmail: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: string | null;
}

interface SubmissionData {
  submissionId: string;
  assessmentType: string;
  customerName: string;
  customerPhone: string;
  submittedAt: string | null;
  updatedAt: string | null;
  finalScore: number | null;
  persona: string | null;
  readiness: string | null;
  ksmGate: boolean | null;
  ksmScore: number | null;
  kprScore: number | null;
  kkbScore: number | null;
  financialGoal: string | null;
  financialNeed: string | null;
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: string;
}

interface DetailData {
  submission: SubmissionData;
  questions: Question[];
  answers: Record<string, string>;
  dimensions: Dimension[] | null;
  auditLog: AuditEntry[];
}

const DIMENSION_STATUS_STYLES: Record<
  string,
  { pill: string; bar: string; label: string }
> = {
  STRONG: { pill: "bg-strong-tint text-strong", bar: "bg-strong", label: "Kuat" },
  GOOD: { pill: "bg-good-tint text-good", bar: "bg-good", label: "Baik" },
  IMPROVE: { pill: "bg-improve-tint text-improve", bar: "bg-improve", label: "Perbaiki" },
  PRIORITY: { pill: "bg-priority-tint text-priority", bar: "bg-priority", label: "Prioritas" },
};

const READINESS_LABELS: Record<string, string> = {
  HIGH: "Readiness: Tinggi",
  MEDIUM: "Readiness: Sedang",
  LOW: "Readiness: Rendah",
};

export default function DetailClient({
  id,
  email,
}: {
  id: string;
  email: string | null;
}) {
  const router = useRouter();
  const { toast, showToast, dismissToast } = useToast();

  const [data, setData] = useState<DetailData | null>(null);
  const [failed, setFailed] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);
  const [completedKey, setCompletedKey] = useState<string | null>(null);

  const [mode, setMode] = useState<"view" | "edit">("view");
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchKey = JSON.stringify([id, reloadTick]);
  const loading = !failed && completedKey !== fetchKey;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`/api/submissions/${id}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace(
            `/admin/login?next=/admin/submission/${id}&expired=true`,
          );
          return;
        }
        const json = (await res.json().catch(() => null)) as
          | (DetailData & { error?: { code?: string } })
          | null;
        if (res.status === 404) {
          if (!cancelled) {
            setNotFound(true);
            setFailed(true);
            setCompletedKey(fetchKey);
          }
          return;
        }
        if (!res.ok || !json?.submission) {
          console.error("[detail] gagal memuat:", res.status, json?.error);
          throw new Error("load-failed");
        }
        if (cancelled) return;
        setData(json);
        setDraftName(json.submission.customerName);
        setDraftPhone(json.submission.customerPhone);
        setDraftAnswers(json.answers);
        setFailed(false);
        setNotFound(false);
        setCompletedKey(fetchKey);
      } catch (err) {
        console.error("[detail] gagal memuat:", err);
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

  // Escape untuk keluar mode edit (tanpa dialog aktif).
  useEffect(() => {
    if (mode !== "edit") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) exitEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, saving]);

  function startEdit() {
    if (!data) return;
    setDraftName(data.submission.customerName);
    setDraftPhone(data.submission.customerPhone);
    setDraftAnswers(data.answers);
    setNameError(null);
    setPhoneError(null);
    setMode("edit");
    window.scrollTo({ top: 0 });
  }

  function exitEdit() {
    setMode("view");
    setNameError(null);
    setPhoneError(null);
  }

  function validateEdit(): boolean {
    let ok = true;
    const n = draftName.trim();
    if (!n) {
      setNameError("Nama wajib diisi.");
      ok = false;
    } else if (n.length < 2) {
      setNameError("Nama minimal 2 huruf.");
      ok = false;
    } else {
      setNameError(null);
    }

    if (!draftPhone.trim()) {
      setPhoneError("Nomor HP wajib diisi.");
      ok = false;
    } else if (!normalizeIndonesianPhone(draftPhone)) {
      setPhoneError(
        "Format nomor belum tepat. Contoh: 0812 3456 7890 atau +62 812 3456 7890.",
      );
      ok = false;
    } else {
      setPhoneError(null);
    }
    return ok;
  }

  async function saveEdit() {
    if (saving || !data) return;
    if (!validateEdit()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draftName.trim(),
          phone: draftPhone.trim(),
          answers: Object.entries(draftAnswers).map(([questionId, optionId]) => ({
            questionId,
            optionId,
          })),
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | (DetailData & { error?: { code?: string; message?: string } })
        | null;

      if (!res.ok || !json?.submission) {
        const code = json?.error?.code ?? "";
        const message = json?.error?.message ?? "Gagal menyimpan perubahan. Coba lagi ya.";
        if (code === "INVALID_PHONE") setPhoneError(message);
        else if (code === "INVALID_INPUT" && message.includes("Nama")) setNameError(message);
        else showToast("error", message);
        return;
      }

      setData(json);
      setDraftName(json.submission.customerName);
      setDraftPhone(json.submission.customerPhone);
      setDraftAnswers(json.answers);
      setMode("view");
      showToast("success", "Perubahan disimpan");
    } catch (err) {
      console.error("[detail] simpan gagal:", err);
      showToast("error", "Sepertinya ada gangguan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  const handleDeleteConfirm = useCallback(async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: { message?: string } }
        | null;
      if (!res.ok || !json?.ok) {
        showToast("error", json?.error?.message ?? "Data gagal dihapus. Coba lagi ya.");
        return;
      }
      setDeleteOpen(false);
      showToast("success", "Data berhasil dihapus");
      // Biarkan toast terlihat sebentar, lalu kembali ke list.
      setTimeout(() => router.push("/admin/dashboard"), 1400);
    } catch (err) {
      console.error("[detail] hapus gagal:", err);
      showToast("error", "Sepertinya ada gangguan. Silakan coba lagi.");
    } finally {
      setDeleting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleting, id, router]);

  if (notFound) {
    return (
      <div className="relative flex min-h-dvh flex-col bg-paper font-sans text-ink">
        <AdminTopBar email={email} title="Dashboard Admin" />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
          <StateCard
            icon={<SearchX className="h-7 w-7" strokeWidth={1.8} />}
            iconClass="bg-accent-tint text-accent-deep"
            title="Data tidak ditemukan"
            body="Submission ini mungkin sudah dihapus, atau tautannya tidak benar."
            actionLabel="Kembali ke dashboard"
            onAction={() => router.push("/admin/dashboard")}
          />
        </main>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="relative flex min-h-dvh flex-col bg-paper font-sans text-ink">
        <AdminTopBar email={email} title="Dashboard Admin" />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12 sm:px-8">
          <StateCard
            icon={<WifiOff className="h-7 w-7" strokeWidth={1.8} />}
            iconClass="bg-error-tint text-error"
            title="Sepertinya ada gangguan."
            body="Detail submission gagal dimuat, tapi datanya aman. Silakan coba lagi ya."
            actionLabel="Coba lagi"
            onAction={() => {
              setFailed(false);
              setCompletedKey(null);
              setReloadTick((t) => t + 1);
            }}
          />
        </main>
        <Toast toast={toast} onDismiss={dismissToast} />
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="relative flex min-h-dvh flex-col bg-paper font-sans text-ink">
        <AdminTopBar email={email} title="Detail Submission" />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-8">
          <div className="h-4 w-40 animate-pulse rounded-full bg-line" />
          <div className="mt-6 space-y-4">
            <div className="h-44 animate-pulse rounded-[1.75rem] bg-card" />
            <div className="h-40 animate-pulse rounded-[1.75rem] bg-card" />
            <div className="h-64 animate-pulse rounded-[1.75rem] bg-card" />
          </div>
        </main>
      </div>
    );
  }

  const s = data.submission;

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-paper font-sans text-ink">
      <Background />
      <AdminTopBar email={email} title="Detail Submission" />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-5 py-7 sm:px-8">
        <Link
          href="/admin/dashboard"
          className="-mx-2 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Semua submission
        </Link>

        {mode === "edit" ? (
          <EditView
            data={data}
            draftName={draftName}
            draftPhone={draftPhone}
            draftAnswers={draftAnswers}
            nameError={nameError}
            phoneError={phoneError}
            saving={saving}
            onName={setDraftName}
            onPhone={setDraftPhone}
            onAnswer={(qid, oid) =>
              setDraftAnswers((prev) => ({ ...prev, [qid]: oid }))
            }
            onCancel={exitEdit}
            onSave={() => void saveEdit()}
          />
        ) : (
          <>
            {/* Header nasabah + aksi (Bab 16.7) */}
            <section className="reveal-up mt-5 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
                    Data nasabah
                  </p>
                  <h1 className="mt-2 break-words font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
                    {s.customerName}
                  </h1>
                  <p className="mt-1.5 text-base font-medium text-muted">
                    {displayPhone(s.customerPhone)}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <AssessmentChip type={s.assessmentType} withIcon />
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-paper px-2.5 py-1 text-[11px] font-semibold text-muted">
                      <Clock className="h-3 w-3" aria-hidden />
                      {formatDateTime(s.submittedAt)}
                    </span>
                  </div>
                  {s.updatedAt && (
                    <p className="mt-3 text-xs font-medium text-muted/90">
                      Terakhir diubah admin: {formatDateTime(s.updatedAt)}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 gap-2.5">
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex h-11 items-center gap-2 rounded-full border border-line bg-paper/70 px-4 text-sm font-semibold text-ink transition-colors duration-200 hover:border-accent hover:text-accent-deep"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteOpen(true)}
                    className="flex h-11 items-center gap-2 rounded-full border border-error-line bg-error-tint px-4 text-sm font-semibold text-error-deep transition-colors duration-200 hover:bg-error hover:text-white"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Hapus
                  </button>
                </div>
              </div>
            </section>

            {/* Hasil ringkas (Bab 16.7) */}
            <section className="reveal-up ad-1 mt-5 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-deep">
                Hasil ringkas
              </p>
              <div className="mt-4">
                <SummaryBlockFull data={data} />
              </div>
            </section>

            {/* Detail jawaban (accordion, Bab 16.7) */}
            <section className="reveal-up ad-2 mt-5 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
              <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">
                Detail jawaban
              </h2>
              <p className="mt-1 text-sm text-muted">
                {data.questions.length} pertanyaan — klik untuk melihat detail
                per soal.
              </p>
              <div className="mt-5 space-y-3">
                {data.questions.map((q, i) => (
                  <AnswerAccordion
                    key={q.questionId}
                    question={q}
                    index={i}
                    selectedOptionId={data.answers[q.questionId]}
                  />
                ))}
              </div>
            </section>

            {/* Riwayat perubahan (audit log, Bab 25) */}
            {data.auditLog.length > 0 && (
              <section className="reveal-up ad-3 mt-5 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
                <h2 className="flex items-center gap-2 font-serif text-xl font-semibold tracking-tight text-ink">
                  <History className="h-5 w-5 text-accent" aria-hidden />
                  Riwayat perubahan
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Jejak edit & hapus oleh admin — otomatis tercatat.
                </p>
                <ol className="mt-5 space-y-4">
                  {data.auditLog.map((entry) => (
                    <AuditItem key={entry.id} entry={entry} />
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </main>

      {deleteOpen && (
        <ConfirmModal
          title="Yakin hapus data ini?"
          description={`Data submission ${s.customerName} akan ditandai terhapus dan tidak muncul lagi di list. Tindakan ini tidak bisa dibatalkan dari aplikasi.`}
          confirmLabel="Ya, hapus data"
          busy={deleting}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setDeleteOpen(false)}
        />
      )}

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}

// ---------- Ringkasan hasil ----------

function SummaryBlockFull({ data }: { data: DetailData }) {
  const s = data.submission;
  if (s.assessmentType === "RATING") {
    return (
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="flex flex-col items-center">
            <span className="font-serif text-6xl font-semibold leading-none tracking-tight text-ink">
              {s.finalScore ?? "—"}
            </span>
            <span className="mt-1 text-sm font-medium text-muted">/ 100</span>
          </div>
          <div className="space-y-3">
            <div>
              <p className="font-serif text-2xl font-semibold tracking-tight text-ink">
                {personaLabel(s.persona)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {s.readiness && (
                  <span className="rounded-full border border-line bg-paper px-3 py-1 text-xs font-semibold text-muted">
                    {READINESS_LABELS[s.readiness] ?? s.readiness}
                  </span>
                )}
                {s.ksmGate === true ? (
                  <span className="rounded-full bg-strong-tint px-3 py-1 text-xs font-semibold text-strong">
                    Siap KSM
                  </span>
                ) : (
                  <span className="rounded-full bg-improve-tint px-3 py-1 text-xs font-semibold text-improve">
                    Belum siap KSM
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted">
                Rekomendasi:
              </span>
              <RecommendationChip
                primary={s.primaryRecommendation}
                secondary={s.secondaryRecommendation}
              />
            </div>
          </div>
        </div>

        {s.financialGoal && (
          <p className="rounded-2xl bg-paper/70 px-4 py-3 text-sm leading-snug text-ink">
            Tujuan finansial:{" "}
            <span className="font-semibold">{s.financialGoal}</span>
          </p>
        )}
        {s.financialNeed && (
          <p className="rounded-2xl bg-paper/70 px-4 py-3 text-sm leading-snug text-ink">
            Kebutuhan finansial:{" "}
            <span className="font-semibold">{s.financialNeed}</span>
          </p>
        )}

        {data.dimensions && data.dimensions.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[...data.dimensions]
              .sort((a, b) => b.rawScore - a.rawScore)
              .map((dim) => (
                <DimensionMini key={dim.dimension} dim={dim} />
              ))}
          </div>
        )}
      </div>
    );
  }

  const maxScore = Math.max(s.ksmScore ?? 0, s.kprScore ?? 0, s.kkbScore ?? 0, 1);
  const rows = [
    { key: "KSM", value: s.ksmScore ?? 0 },
    { key: "KPR", value: s.kprScore ?? 0 },
    { key: "KKB", value: s.kkbScore ?? 0 },
  ];
  return (
    <div className="space-y-6">
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.key}>
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-ink">{r.key}</span>
              <span className="text-sm font-medium text-muted">{r.value}</span>
            </div>
            <div
              className="mt-1.5 h-2 overflow-hidden rounded-full bg-line"
              role="img"
              aria-label={`Skor ${r.key}: ${r.value}`}
            >
              <div
                className={`h-full rounded-full ${
                  r.key === s.primaryRecommendation ? "bg-accent" : "bg-accent/30"
                }`}
                style={{ width: `${Math.min(100, (r.value / maxScore) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted">Rekomendasi:</span>
        <RecommendationChip
          primary={s.primaryRecommendation}
          secondary={s.secondaryRecommendation}
        />
        {s.recommendationConfidence === "DUAL" && (
          <span className="text-xs font-medium text-muted">
            (kebutuhan berimbang)
          </span>
        )}
      </div>
    </div>
  );
}

function DimensionMini({ dim }: { dim: Dimension }) {
  const st = DIMENSION_STATUS_STYLES[dim.status] ?? DIMENSION_STATUS_STYLES.IMPROVE;
  return (
    <div className="rounded-2xl border border-line bg-paper/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <span className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted">
          {dim.label}
        </span>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.pill}`}>
          {st.label}
        </span>
      </div>
      <div
        className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"
        role="img"
        aria-label={`${dim.label}: ${dim.rawScore} dari 100`}
      >
        <div
          className={`h-full rounded-full ${st.bar}`}
          style={{ width: `${Math.min(100, Math.max(0, dim.rawScore))}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-semibold text-ink">
        {dim.rawScore}
        <span className="font-medium text-muted/90">/100</span>
      </p>
    </div>
  );
}

// ---------- Detail jawaban (accordion) ----------

function AnswerAccordion({
  question,
  index,
  selectedOptionId,
}: {
  question: Question;
  index: number;
  selectedOptionId: string | undefined;
}) {
  const [open, setOpen] = useState(false);
  const selected = question.options.find((o) => o.optionId === selectedOptionId);

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`answer-${question.questionId}`}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper/60 sm:px-5"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-paper text-xs font-bold text-muted">
          {index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">
            {selected ? selected.optionText : "Belum terjawab"}
          </span>
          {question.dimension && (
            <span className="block text-xs font-medium text-muted">
              {question.dimension}
            </span>
          )}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open && (
        <div
          id={`answer-${question.questionId}`}
          className="border-t border-line bg-paper/40 px-4 py-4 sm:px-5"
        >
          <p className="text-sm font-medium leading-relaxed text-ink">
            {question.questionText}
          </p>
          <ul className="mt-3 space-y-1.5">
            {question.options.map((o) => {
              const isSel = o.optionId === selectedOptionId;
              return (
                <li
                  key={o.optionId}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm ${
                    isSel
                      ? "border-accent/40 bg-accent-tint font-semibold text-accent-deep"
                      : "border-transparent text-muted"
                  }`}
                >
                  {isSel && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                  <span className={isSel ? "" : "pl-6"}>{o.optionText}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Audit log ----------

const FIELD_LABELS: Record<string, string> = {
  customerName: "Nama",
  customerPhone: "Nomor HP",
  finalScore: "Skor final",
  persona: "Persona",
  readiness: "Readiness",
  ksmGate: "KSM Gate",
  ksmScore: "Skor KSM",
  kprScore: "Skor KPR",
  kkbScore: "Skor KKB",
  primaryRecommendation: "Rekomendasi utama",
  secondaryRecommendation: "Rekomendasi kedua",
  recommendationConfidence: "Konfidensi",
  financialGoal: "Tujuan finansial",
  financialNeed: "Kebutuhan finansial",
};

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Ya" : "Tidak";
  if (value === "KSM_GATE") return "Siap KSM";
  return String(value);
}

function AuditItem({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false);
  const oldObj =
    entry.oldValue && typeof entry.oldValue === "object"
      ? (entry.oldValue as Record<string, unknown>)
      : null;
  const newObj =
    entry.newValue && typeof entry.newValue === "object"
      ? (entry.newValue as Record<string, unknown>)
      : null;
  const keys = newObj ? Object.keys(newObj) : oldObj ? Object.keys(oldObj) : [];
  const isDelete = entry.action === "DELETE";

  return (
    <li className="rounded-2xl border border-line bg-paper/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
            isDelete ? "bg-error-tint text-error-deep" : "bg-accent-tint text-accent-deep"
          }`}
        >
          {isDelete ? "Dihapus" : "Diubah"}
        </span>
        <span className="text-sm font-semibold text-ink">{entry.adminEmail}</span>
        <span className="ml-auto text-xs font-medium text-muted">
          {formatDateTime(entry.createdAt)}
        </span>
      </div>

      {!isDelete && newObj && keys.length > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-accent-deep transition-colors hover:text-accent"
        >
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
          {keys.length} field berubah — lihat detail
        </button>
      )}

      {open && newObj && (
        <dl className="mt-3 space-y-2">
          {keys.map((key) => (
            <div
              key={key}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-xl bg-card px-3 py-2 text-sm"
            >
              <dt className="w-full font-semibold text-muted sm:w-40 sm:shrink-0">
                {FIELD_LABELS[key] ?? key}
              </dt>
              <dd className="min-w-0 text-ink">
                <span className="text-muted line-through decoration-error/50">
                  {formatAuditValue(oldObj?.[key])}
                </span>
                <span className="mx-1.5 text-muted" aria-hidden>
                  →
                </span>
                <span className="font-semibold">{formatAuditValue(newObj[key])}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

// ---------- Mode edit ----------

function EditView({
  data,
  draftName,
  draftPhone,
  draftAnswers,
  nameError,
  phoneError,
  saving,
  onName,
  onPhone,
  onAnswer,
  onCancel,
  onSave,
}: {
  data: DetailData;
  draftName: string;
  draftPhone: string;
  draftAnswers: Record<string, string>;
  nameError: string | null;
  phoneError: string | null;
  saving: boolean;
  onName: (v: string) => void;
  onPhone: (v: string) => void;
  onAnswer: (questionId: string, optionId: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const s = data.submission;
  return (
    <div className="reveal-up mt-5 space-y-5">
      <section className="rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink">
              Edit data
            </h1>
            <p className="mt-1 text-sm text-muted">
              Perbaikan input nasabah — skor & rekomendasi dihitung ulang
              otomatis.
            </p>
          </div>
          <AssessmentChip type={s.assessmentType} />
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="edit-name" className="mb-1.5 block text-sm font-semibold text-ink">
              Nama nasabah
            </label>
            <input
              id="edit-name"
              type="text"
              value={draftName}
              onChange={(e) => onName(e.target.value)}
              disabled={saving}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "edit-name-error" : undefined}
              className={[
                "h-12 w-full rounded-2xl border bg-paper/70 px-4 text-base text-ink transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-4 disabled:opacity-60",
                nameError
                  ? "border-error-line focus:border-error focus:ring-error/15"
                  : "border-line focus:border-accent focus:ring-accent/15",
              ].join(" ")}
            />
            {nameError && (
              <p
                id="edit-name-error"
                role="alert"
                className="mt-2 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-error"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {nameError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="edit-phone" className="mb-1.5 block text-sm font-semibold text-ink">
              Nomor HP
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={draftPhone}
              onChange={(e) => onPhone(e.target.value)}
              disabled={saving}
              aria-invalid={phoneError ? true : undefined}
              aria-describedby={phoneError ? "edit-phone-error" : undefined}
              className={[
                "h-12 w-full rounded-2xl border bg-paper/70 px-4 text-base text-ink transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-4 disabled:opacity-60",
                phoneError
                  ? "border-error-line focus:border-error focus:ring-error/15"
                  : "border-line focus:border-accent focus:ring-accent/15",
              ].join(" ")}
            />
            {phoneError ? (
              <p
                id="edit-phone-error"
                role="alert"
                className="mt-2 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-error"
              >
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {phoneError}
              </p>
            ) : (
              <p className="mt-2 text-xs text-muted/90">
                Format: 08xx atau +62 8xx
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] border border-line bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl font-semibold tracking-tight text-ink">
          Jawaban
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ubah jawaban bila ada koreksi — semua soal wajib punya pilihan.
        </p>

        <div className="mt-5 space-y-6">
          {data.questions.map((q, i) => (
            <fieldset key={q.questionId} className="relative">
              <legend className="sr-only">{q.questionText}</legend>
              <p className="text-sm font-semibold leading-relaxed text-ink">
                <span className="mr-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-paper text-xs font-bold text-muted">
                  {i + 1}
                </span>
                {q.questionText}
              </p>
              {!q.isScoring && (
                <p className="mt-1 text-xs font-medium text-muted/90">
                  Tidak memengaruhi skor (hanya catatan).
                </p>
              )}
              <div className="mt-3 space-y-2">
                {q.options.map((o) => {
                  const isSel = draftAnswers[q.questionId] === o.optionId;
                  return (
                    <label
                      key={o.optionId}
                      className={[
                        "flex min-h-11 cursor-pointer items-center gap-3 rounded-2xl border px-4 py-2.5 transition-[border-color,background-color] duration-150",
                        isSel
                          ? "border-accent bg-accent-tint"
                          : "border-line bg-paper/40 hover:border-accent/40",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name={`edit-${q.questionId}`}
                        value={o.optionId}
                        checked={isSel}
                        disabled={saving}
                        onChange={() => onAnswer(q.questionId, o.optionId)}
                        className="sr-only"
                      />
                      <span
                        aria-hidden
                        className={[
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                          isSel ? "border-accent bg-accent" : "border-line bg-card",
                        ].join(" ")}
                      >
                        {isSel && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <span
                        className={[
                          "text-sm leading-snug",
                          isSel ? "font-semibold text-accent-deep" : "text-ink",
                        ].join(" ")}
                      >
                        {o.optionText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 pb-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex h-12 items-center justify-center rounded-full border border-line bg-card px-7 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex h-12 items-center justify-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          {saving ? "Menyimpan…" : "Simpan perubahan"}
        </button>
      </div>
    </div>
  );
}

// ---------- State umum ----------

function StateCard({
  icon,
  iconClass,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="reveal-up rounded-[1.75rem] border border-line bg-card p-7 sm:p-10">
      <div className="flex flex-col items-center py-8 text-center">
        <span className={`flex h-16 w-16 items-center justify-center rounded-full ${iconClass}`}>
          {icon}
        </span>
        <h1 className="mt-5 font-serif text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-muted">{body}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-7 inline-flex h-12 items-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.98]"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function Background() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-dots absolute inset-x-0 top-0 h-[420px]" />
      <div className="glow absolute -top-28 left-[-12%] h-[440px] w-[440px] rounded-full" />
    </div>
  );
}
