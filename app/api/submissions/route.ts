import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildRatingRecommendation } from "@/lib/scoring/recommendation";
import { calculateRatingScore } from "@/lib/scoring/rating";
import {
  DIMENSION_KEY_TO_LABEL,
  type DimensionKey,
  type RatingScoreResult,
} from "@/lib/scoring/constants";
import {
  buildNeedsRecommendation,
  sumNeedsScores,
  type NeedsRecommendation,
} from "@/lib/scoring/needs";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";

// POST /api/submissions — Bab 22 (publik), AC10, Bab 23.
// Alur RATING:
//  1. Validasi lengkap di server (nama, no HP, jawaban — Bab 23).
//  2. Skor dihitung ULANG dari DB berdasarkan option_id — nilai dari client
//     tidak pernah dipercaya (anti-manipulasi, Bab 23).
//  3. Insert submission + submission_answer + dimension_result via service
//     role key (Bab 22), termasuk snapshot perhitungan (audit, Bab 12.5/F4).
//  4. Idempoten: nomor yang sudah pernah submit RATING dikembalikan
//     submission lamanya (edge case double-submit, Bab 11).
// Alur NEEDS (F7/F8):
//  1-2. Sama — skor KSM/KPR/KKB dihitung ulang dari DB (score_ksm/kpr/kkb).
//  3. Insert submission + submission_answer, simpan skor kategori + hasil
//     rekomendasi (Bab 12.3, 8.5) — tanpa dimension_result.
//  4. Idempoten per (customer_phone, assessment_type) (F14).

type AnswerInput = { questionId?: unknown; optionId?: unknown };

type SubmissionResultPayload = {
  finalScore: number;
  persona: string;
  readiness: string;
  ksmGate: boolean;
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: string;
  financialGoal: string | null;
  financialNeed: string | null;
  dimensions: {
    dimension: string;
    label: string;
    rawScore: number;
    contribution: number;
    status: string;
  }[];
};

/** Snapshot hasil NEEDS (F9/Bab 16.4) — disimpan di submission + dikirim ke client. */
type NeedsResultPayload = {
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: string;
  ksmScore: number;
  kprScore: number;
  kkbScore: number;
};

// Rate limiting sederhana per nomor HP (Bab 23) — in-memory, cukup untuk
// skala demo (puluhan–ratusan submission, Bab 24).
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 jam
const submitAttempts = new Map<string, number[]>();

function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const recent = (submitAttempts.get(phone) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  submitAttempts.set(phone, recent);
  return recent.length > RATE_LIMIT_MAX;
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function resultFromCalculation(
  score: RatingScoreResult,
  rec: ReturnType<typeof buildRatingRecommendation>,
  financialGoal: string | null,
  financialNeed: string | null,
): SubmissionResultPayload {
  return {
    finalScore: score.finalScore,
    persona: score.persona,
    readiness: score.readiness,
    ksmGate: rec.ksmGate,
    primaryRecommendation: rec.primaryRecommendation,
    secondaryRecommendation: rec.secondaryRecommendation ?? null,
    // Assumption (belum didefinisi PRD untuk RATING): KSM Gate PASS =
    // rekomendasi produk jelas (STRONG), FAIL = arahan advice (MODERATE).
    recommendationConfidence: rec.ksmGate ? "STRONG" : "MODERATE",
    financialGoal,
    financialNeed,
    dimensions: score.dimensions.map((d) => ({
      dimension: d.key,
      label: d.label,
      rawScore: d.rawScore,
      contribution: d.contribution,
      status: d.status,
    })),
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Body request tidak valid.");
  }

  const {
    name,
    phone,
    assessmentType,
    answers,
  } = (body ?? {}) as {
    name?: unknown;
    phone?: unknown;
    assessmentType?: unknown;
    answers?: unknown;
  };

  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (trimmedName.length < 2) {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "Nama minimal 2 huruf ya.",
    );
  }

  const normalizedPhone =
    typeof phone === "string" ? normalizeIndonesianPhone(phone) : null;
  if (!normalizedPhone) {
    return errorResponse(
      400,
      "INVALID_PHONE",
      "Nomor HP tidak valid. Gunakan format Indonesia (08xx atau +62).",
    );
  }

  if (isRateLimited(normalizedPhone)) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Terlalu banyak percobaan. Beri jeda sebentar, lalu coba lagi ya.",
    );
  }

  if (assessmentType === "NEEDS") {
    return handleNeedsSubmission(answers, trimmedName, normalizedPhone);
  }
  if (assessmentType !== "RATING") {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "Jenis assessment tidak dikenal.",
    );
  }

  const supabase = createAdminClient();

  // Ambil pertanyaan + opsi + skor dari DB (source of truth, Bab 31).
  const { data: questionRows, error: qError } = await supabase
    .from("question_bank")
    .select("question_id, is_scoring, order_index")
    .eq("assessment_type", "RATING")
    .order("order_index");
  if (qError || !questionRows) {
    console.error("[submissions] gagal memuat pertanyaan:", qError);
    return errorResponse(
      500,
      "INTERNAL",
      "Terjadi gangguan saat memproses jawaban. Coba lagi ya.",
    );
  }

  const questionIds = questionRows.map((q) => q.question_id);
  const { data: optionRows, error: oError } = await supabase
    .from("question_option")
    .select("option_id, question_id, option_text, score_rating")
    .in("question_id", questionIds);
  if (oError || !optionRows) {
    console.error("[submissions] gagal memuat opsi:", oError);
    return errorResponse(
      500,
      "INTERNAL",
      "Terjadi gangguan saat memproses jawaban. Coba lagi ya.",
    );
  }

  const validOptions = new Map<string, Map<string, { text: string; score: number | null }>>();
  for (const row of optionRows) {
    let byQuestion = validOptions.get(row.question_id);
    if (!byQuestion) {
      byQuestion = new Map();
      validOptions.set(row.question_id, byQuestion);
    }
    byQuestion.set(row.option_id, {
      text: row.option_text,
      score: row.score_rating,
    });
  }

  // ---- Validasi jawaban (AC10, Bab 23) ----
  if (!Array.isArray(answers)) {
    return errorResponse(
      400,
      "INVALID_ANSWER",
      "Jawaban tidak valid. Silakan coba lagi ya.",
    );
  }

  const picked = new Map<string, string>(); // questionId -> optionId
  for (const item of answers) {
    const answer = (item ?? {}) as AnswerInput;
    const questionId =
      typeof answer.questionId === "string" ? answer.questionId : "";
    const optionId = typeof answer.optionId === "string" ? answer.optionId : "";
    if (!questionIds.includes(questionId)) {
      return errorResponse(
        400,
        "INVALID_ANSWER",
        "Ada pertanyaan yang tidak dikenali. Silakan coba lagi ya.",
      );
    }
    if (picked.has(questionId)) {
      return errorResponse(
        400,
        "INVALID_ANSWER",
        "Ada jawaban yang ganda. Silakan coba lagi ya.",
      );
    }
    const options = validOptions.get(questionId);
    if (!options || !options.has(optionId)) {
      return errorResponse(
        400,
        "INVALID_ANSWER",
        "Ada pilihan jawaban yang tidak valid. Silakan coba lagi ya.",
      );
    }
    picked.set(questionId, optionId);
  }

  // AC10: semua pertanyaan wajib terjawab — kembalikan yang terlewat agar
  // client bisa mengarahkan nasabah ke soal yang belum dijawab.
  const missingQuestionIds = questionIds.filter((id) => !picked.has(id));
  if (missingQuestionIds.length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "INCOMPLETE_ANSWERS",
          message: "Belum semua pertanyaan dijawab.",
          missingQuestionIds,
        },
      },
      { status: 400 },
    );
  }

  // Idempoten (Bab 11): kalau nomor ini sudah punya submission RATING yang
  // aktif, kembalikan yang lama — jangan buat record baru (F14).
  const existing = await findExistingSubmission(supabase, normalizedPhone);
  if (existing) {
    return NextResponse.json(existing);
  }

  // ---- Hitung skor di server (F4/F5, Bab 8) ----
  const scores: Record<string, number> = {};
  for (const [questionId, optionId] of picked) {
    const option = validOptions.get(questionId)?.get(optionId);
    if (option?.score != null) scores[questionId] = option.score;
  }
  const score = calculateRatingScore(scores);
  const rec = buildRatingRecommendation(score);
  const financialGoal =
    validOptions.get("Q13_RATING")?.get(picked.get("Q13_RATING")!)?.text ??
    null;
  const financialNeed =
    validOptions.get("Q14_RATING")?.get(picked.get("Q14_RATING")!)?.text ??
    null;

  const now = new Date().toISOString();
  const { data: submissionRow, error: insertError } = await supabase
    .from("submission")
    .insert({
      assessment_type: "RATING",
      customer_name: trimmedName,
      customer_phone: normalizedPhone,
      final_score: score.finalScore,
      persona: score.persona,
      readiness: score.readiness,
      ksm_gate: rec.ksmGate,
      primary_recommendation: rec.primaryRecommendation,
      secondary_recommendation: rec.secondaryRecommendation ?? null,
      recommendation_confidence: rec.ksmGate ? "STRONG" : "MODERATE",
      financial_goal: financialGoal,
      financial_need: financialNeed,
      submitted_at: now,
    })
    .select("submission_id")
    .single();

  if (insertError) {
    // Unique violation (customer_phone, assessment_type) = race condition
    // double-submit → kembalikan submission yang menang.
    if (insertError.code === "23505") {
      const winner = await findExistingSubmission(supabase, normalizedPhone);
      if (winner) return NextResponse.json(winner);
    }
    console.error("[submissions] insert submission gagal:", insertError);
    return errorResponse(
      500,
      "INTERNAL",
      "Jawaban belum tersimpan. Data kamu aman — silakan coba lagi.",
    );
  }

  const submissionId = submissionRow.submission_id;

  const { error: answersError } = await supabase.from("submission_answer").insert(
    questionIds.map((questionId) => ({
      submission_id: submissionId,
      question_id: questionId,
      option_id: picked.get(questionId)!,
    })),
  );
  if (answersError) {
    console.error("[submissions] insert submission_answer gagal:", answersError);
    return errorResponse(
      500,
      "INTERNAL",
      "Jawaban belum tersimpan sepenuhnya. Silakan coba lagi.",
    );
  }

  const { error: dimsError } = await supabase.from("dimension_result").insert(
    score.dimensions.map((d) => ({
      submission_id: submissionId,
      dimension: d.key,
      raw_score: d.rawScore,
      contribution: d.contribution,
      status: d.status,
    })),
  );
  if (dimsError) {
    // Snapshot dimensi gagal — data utama + jawaban mentah sudah tersimpan
    // (recomputable, Bab 24). Log untuk developer, tetap sukses.
    console.error("[submissions] insert dimension_result gagal:", dimsError);
  }

  return NextResponse.json(
    {
      submissionId,
      result: resultFromCalculation(score, rec, financialGoal, financialNeed),
    },
    { status: 201 },
  );
}

// ---------------------------------------------------------------------------
// NEEDS (F7/F8) — skor KSM/KPR/KKB dihitung ulang dari DB, lalu simpan
// submission + submission_answer + snapshot rekomendasi (Bab 8.5, 12.3).
// ---------------------------------------------------------------------------

function needsAnswerMap(
  picked: Map<string, string>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [questionId, optionId] of picked) map[questionId] = optionId;
  return map;
}

function buildNeedsResult(rec: NeedsRecommendation): NeedsResultPayload {
  return {
    primaryRecommendation: rec.primary,
    secondaryRecommendation: rec.secondary ?? null,
    recommendationConfidence: rec.confidence,
    ksmScore: rec.scores.ksm,
    kprScore: rec.scores.kpr,
    kkbScore: rec.scores.kkb,
  };
}

async function handleNeedsSubmission(
  answers: unknown,
  trimmedName: string,
  normalizedPhone: string,
) {
  const supabase = createAdminClient();

  const { data: questionRows, error: qError } = await supabase
    .from("question_bank")
    .select("question_id, order_index")
    .eq("assessment_type", "NEEDS")
    .order("order_index");
  if (qError || !questionRows) {
    console.error("[submissions] gagal memuat pertanyaan NEEDS:", qError);
    return errorResponse(
      500,
      "INTERNAL",
      "Terjadi gangguan saat memproses jawaban. Coba lagi ya.",
    );
  }

  const questionIds = questionRows.map((q) => q.question_id);
  const { data: optionRows, error: oError } = await supabase
    .from("question_option")
    .select(
      "option_id, question_id, option_text, score_ksm, score_kpr, score_kkb",
    )
    .in("question_id", questionIds);
  if (oError || !optionRows) {
    console.error("[submissions] gagal memuat opsi NEEDS:", oError);
    return errorResponse(
      500,
      "INTERNAL",
      "Terjadi gangguan saat memproses jawaban. Coba lagi ya.",
    );
  }

  // Validasi jawaban identik dengan RATING: semua pertanyaan wajib terjawab,
  // opsi harus valid, tidak boleh ganda (AC10, Bab 23).
  if (!Array.isArray(answers)) {
    return errorResponse(
      400,
      "INVALID_ANSWER",
      "Jawaban tidak valid. Silakan coba lagi ya.",
    );
  }

  const validOptions = new Map<
    string,
    Map<string, { ksm: number; kpr: number; kkb: number }>
  >();
  for (const row of optionRows) {
    let byQuestion = validOptions.get(row.question_id);
    if (!byQuestion) {
      byQuestion = new Map();
      validOptions.set(row.question_id, byQuestion);
    }
    byQuestion.set(row.option_id, {
      ksm: row.score_ksm ?? 0,
      kpr: row.score_kpr ?? 0,
      kkb: row.score_kkb ?? 0,
    });
  }

  const picked = new Map<string, string>();
  for (const item of answers) {
    const answer = (item ?? {}) as AnswerInput;
    const questionId =
      typeof answer.questionId === "string" ? answer.questionId : "";
    const optionId = typeof answer.optionId === "string" ? answer.optionId : "";
    if (!questionIds.includes(questionId)) {
      return errorResponse(
        400,
        "INVALID_ANSWER",
        "Ada pertanyaan yang tidak dikenali. Silakan coba lagi ya.",
      );
    }
    if (picked.has(questionId)) {
      return errorResponse(
        400,
        "INVALID_ANSWER",
        "Ada jawaban yang ganda. Silakan coba lagi ya.",
      );
    }
    const options = validOptions.get(questionId);
    if (!options || !options.has(optionId)) {
      return errorResponse(
        400,
        "INVALID_ANSWER",
        "Ada pilihan jawaban yang tidak valid. Silakan coba lagi ya.",
      );
    }
    picked.set(questionId, optionId);
  }

  const missingQuestionIds = questionIds.filter((id) => !picked.has(id));
  if (missingQuestionIds.length > 0) {
    return NextResponse.json(
      {
        error: {
          code: "INCOMPLETE_ANSWERS",
          message: "Belum semua pertanyaan dijawab.",
          missingQuestionIds,
        },
      },
      { status: 400 },
    );
  }

  // Idempoten (F14): nomor yang sudah pernah submit NEEDS -> kembalikan lama.
  const existing = await findExistingNeedsSubmission(supabase, normalizedPhone);
  if (existing) return NextResponse.json(existing);

  // ---- Hitung skor di server (F8, Bab 8.5) ----
  const pointsByQuestion: Record<string, { ksm: number; kpr: number; kkb: number }> = {};
  for (const [questionId, optionId] of picked) {
    const option = validOptions.get(questionId)?.get(optionId);
    if (option) pointsByQuestion[questionId] = option;
  }
  const scores = sumNeedsScores(pointsByQuestion);
  const rec = buildNeedsRecommendation(scores, {
    actualNeed: needsAnswerMap(picked).Q7_NEEDS ?? null,
    urgency: needsAnswerMap(picked).Q9_NEEDS ?? null,
    assetGap: needsAnswerMap(picked).Q3_NEEDS ?? null,
    lifeStage: needsAnswerMap(picked).Q1_NEEDS ?? null,
  });
  const result = buildNeedsResult(rec);

  const now = new Date().toISOString();
  const { data: submissionRow, error: insertError } = await supabase
    .from("submission")
    .insert({
      assessment_type: "NEEDS",
      customer_name: trimmedName,
      customer_phone: normalizedPhone,
      ksm_score: result.ksmScore,
      kpr_score: result.kprScore,
      kkb_score: result.kkbScore,
      primary_recommendation: result.primaryRecommendation,
      secondary_recommendation: result.secondaryRecommendation,
      recommendation_confidence: result.recommendationConfidence,
      submitted_at: now,
    })
    .select("submission_id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const winner = await findExistingNeedsSubmission(supabase, normalizedPhone);
      if (winner) return NextResponse.json(winner);
    }
    console.error("[submissions] insert submission NEEDS gagal:", insertError);
    return errorResponse(
      500,
      "INTERNAL",
      "Jawaban belum tersimpan. Data kamu aman — silakan coba lagi.",
    );
  }

  const submissionId = submissionRow.submission_id;

  const { error: answersError } = await supabase.from("submission_answer").insert(
    questionIds.map((questionId) => ({
      submission_id: submissionId,
      question_id: questionId,
      option_id: picked.get(questionId)!,
    })),
  );
  if (answersError) {
    console.error("[submissions] insert submission_answer NEEDS gagal:", answersError);
    return errorResponse(
      500,
      "INTERNAL",
      "Jawaban belum tersimpan sepenuhnya. Silakan coba lagi.",
    );
  }

  return NextResponse.json(
    {
      submissionId,
      result,
    },
    { status: 201 },
  );
}

// Cari submission NEEDS aktif (belum soft-delete) terbaru untuk nomor ini.
async function findExistingNeedsSubmission(
  supabase: ReturnType<typeof createAdminClient>,
  phone: string,
) {
  const { data, error } = await supabase
    .from("submission")
    .select(
      "submission_id, ksm_score, kpr_score, kkb_score, primary_recommendation, secondary_recommendation, recommendation_confidence",
    )
    .eq("customer_phone", phone)
    .eq("assessment_type", "NEEDS")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return {
    submissionId: row.submission_id,
    alreadyExists: true,
    result: {
      primaryRecommendation: row.primary_recommendation,
      secondaryRecommendation: row.secondary_recommendation,
      recommendationConfidence: row.recommendation_confidence,
      ksmScore: row.ksm_score ?? 0,
      kprScore: row.kpr_score ?? 0,
      kkbScore: row.kkb_score ?? 0,
    } satisfies NeedsResultPayload,
  };
}

// Cari submission aktif (belum soft-delete) terbaru untuk nomor ini.
// Dipakai untuk jalur idempoten + race condition double-submit.
async function findExistingSubmission(
  supabase: ReturnType<typeof createAdminClient>,
  phone: string,
) {
  const { data, error } = await supabase
    .from("submission")
    .select(
      "submission_id, final_score, persona, readiness, ksm_gate, primary_recommendation, secondary_recommendation, recommendation_confidence, financial_goal, financial_need",
    )
    .eq("customer_phone", phone)
    .eq("assessment_type", "RATING")
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;

  const row = data[0];
  const { data: dims } = await supabase
    .from("dimension_result")
    .select("dimension, raw_score, contribution, status")
    .eq("submission_id", row.submission_id);

  return {
    submissionId: row.submission_id,
    alreadyExists: true,
    result: {
      finalScore: row.final_score ?? 0,
      persona: row.persona ?? "",
      readiness: row.readiness ?? "",
      ksmGate: row.ksm_gate ?? false,
      primaryRecommendation: row.primary_recommendation,
      secondaryRecommendation: row.secondary_recommendation,
      recommendationConfidence: row.recommendation_confidence,
      financialGoal: row.financial_goal,
      financialNeed: row.financial_need,
      dimensions: (dims ?? []).map((d) => ({
        dimension: d.dimension,
        label: dimensionLabel(d.dimension),
        rawScore: d.raw_score,
        contribution: d.contribution,
        status: d.status,
      })),
    } satisfies SubmissionResultPayload,
  };
}

function dimensionLabel(key: string): string {
  return DIMENSION_KEY_TO_LABEL[key as DimensionKey] ?? key;
}
