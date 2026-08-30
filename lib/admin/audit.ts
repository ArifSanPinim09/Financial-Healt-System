// Pembentukan isi audit log untuk aksi edit (UPDATE) & hapus (DELETE)
// submission oleh admin (PRD Bab 25 — wajib: siapa, field apa yang berubah,
// nilai sebelum & sesudah, kapan). Dibuat murni agar bisa di-unit-test.

/** Field submission yang ikut dicatat pada audit DELETE (snapshot sebelum hapus). */
export const DELETED_SNAPSHOT_FIELDS = [
  "assessmentType",
  "customerName",
  "customerPhone",
  "submittedAt",
  "finalScore",
  "persona",
  "readiness",
  "ksmGate",
  "ksmScore",
  "kprScore",
  "kkbScore",
  "financialGoal",
  "financialNeed",
  "primaryRecommendation",
  "secondaryRecommendation",
  "recommendationConfidence",
] as const;

export type SnapshotKey = (typeof DELETED_SNAPSHOT_FIELDS)[number];

export type SubmissionSnapshot = Partial<
  Record<SnapshotKey, string | number | boolean | null>
>;

/** Kunci field yang dibandingkan saat UPDATE (identitas + hasil terhitung). */
const UPDATE_COMPARED_KEYS: SnapshotKey[] = [
  "customerName",
  "customerPhone",
  "finalScore",
  "persona",
  "readiness",
  "ksmGate",
  "ksmScore",
  "kprScore",
  "kkbScore",
  "primaryRecommendation",
  "secondaryRecommendation",
  "recommendationConfidence",
  "financialGoal",
  "financialNeed",
];

export interface AuditChange {
  /** false jika tidak ada yang berubah (jangan buat baris audit sama sekali). */
  changed: boolean;
  /** Nilai lama hanya untuk field yang berubah (null berarti "tidak ada/tidak berubah"). */
  oldValue: Record<string, unknown> | null;
  /** Nilai baru hanya untuk field yang berubah. */
  newValue: Record<string, unknown> | null;
}

/**
 * Hitung field apa saja yang berubah antara `old` dan `next`, lalu kemas
 * pasangan before/after. `answersOld`/`answersNext` (map questionId →
 * optionId) dimasukkan sebagai satu field "answers" bila ada yang berubah.
 */
export function buildAuditChange(
  old: SubmissionSnapshot,
  next: SubmissionSnapshot,
  answersOld?: Record<string, string> | null,
  answersNext?: Record<string, string> | null,
): AuditChange {
  const oldValue: Record<string, unknown> = {};
  const newValue: Record<string, unknown> = {};
  let changed = false;

  for (const key of UPDATE_COMPARED_KEYS) {
    const a = old[key] ?? null;
    const b = next[key] ?? null;
    if (a === b) continue;
    oldValue[key] = a;
    newValue[key] = b;
    changed = true;
  }

  const oldAnswers = answersOld ?? {};
  const nextAnswers = answersNext ?? {};
  if (
    JSON.stringify(orderedAnswers(oldAnswers)) !==
    JSON.stringify(orderedAnswers(nextAnswers))
  ) {
    oldValue.answers = oldAnswers;
    newValue.answers = nextAnswers;
    changed = true;
  }

  return { changed, oldValue: changed ? oldValue : null, newValue: changed ? newValue : null };
}

/**
 * Snapshot baris utuh untuk audit DELETE (Bab 25: data tetap ada di DB
 * dengan flag deleted_at — snapshot ini memudahkan pemulihan/pembandingan).
 */
export function buildDeleteSnapshot(row: SubmissionSnapshot): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const key of DELETED_SNAPSHOT_FIELDS) {
    snapshot[key] = row[key] ?? null;
  }
  return snapshot;
}

function orderedAnswers(
  answers: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(answers).sort()) out[key] = answers[key];
  return out;
}
