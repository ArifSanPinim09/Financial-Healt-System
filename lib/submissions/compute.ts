// Rekalkulasi hasil assessment dari jawaban terpilih — dipakai endpoint
// admin edit (PATCH /api/submissions/:id, Bab F10/25) agar nilai yang
// tersimpan selalu konsisten dengan engine scoring yang sama persis dengan
// submit (deterministik, Bab 24). Murni (tanpa Supabase) → testable.

import { DIMENSION_KEY_TO_LABEL, type DimensionKey } from "@/lib/scoring/constants";
import { buildNeedsRecommendation, sumNeedsScores } from "@/lib/scoring/needs";
import { buildRatingRecommendation } from "@/lib/scoring/recommendation";
import { calculateRatingScore } from "@/lib/scoring/rating";

export type QuestionBankRow = {
  question_id: string;
  dimension: string | null;
  question_text: string;
  order_index: number;
  is_scoring: boolean;
};

export type OptionRow = {
  option_id: string;
  question_id: string;
  option_text: string;
  option_detail?: string | null;
  score_rating: number | null;
  score_ksm: number | null;
  score_kpr: number | null;
  score_kkb: number | null;
};

/** questionId -> optionId (jawaban terpilih). */
export type PickedAnswers = Record<string, string>;

export type AnswersValidation =
  | { ok: true; picked: PickedAnswers }
  | {
      ok: false;
      code: "INVALID_ANSWER" | "INCOMPLETE_ANSWERS";
      message: string;
      missingQuestionIds?: string[];
    };

export interface RatingRecalculation {
  finalScore: number;
  persona: string;
  readiness: string;
  ksmGate: boolean;
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: "STRONG" | "MODERATE";
  financialGoal: string | null;
  financialNeed: string | null;
  dimensions: {
    dimension: string;
    label: string;
    rawScore: number;
    contribution: number;
    status: string;
  }[];
}

export interface NeedsRecalculation {
  ksmScore: number;
  kprScore: number;
  kkbScore: number;
  primaryRecommendation: string;
  secondaryRecommendation: string | null;
  recommendationConfidence: string;
}

type RatingOptionMap = Map<string, Map<string, { text: string; score: number | null }>>;
type NeedsOptionMap = Map<string, Map<string, { ksm: number; kpr: number; kkb: number }>>;

export function buildRatingOptionMap(
  options: OptionRow[],
): RatingOptionMap {
  const map: RatingOptionMap = new Map();
  for (const row of options) {
    let byQuestion = map.get(row.question_id);
    if (!byQuestion) {
      byQuestion = new Map();
      map.set(row.question_id, byQuestion);
    }
    byQuestion.set(row.option_id, {
      text: row.option_text,
      score: row.score_rating,
    });
  }
  return map;
}

export function buildNeedsOptionMap(
  options: OptionRow[],
): NeedsOptionMap {
  const map: NeedsOptionMap = new Map();
  for (const row of options) {
    let byQuestion = map.get(row.question_id);
    if (!byQuestion) {
      byQuestion = new Map();
      map.set(row.question_id, byQuestion);
    }
    byQuestion.set(row.option_id, {
      ksm: row.score_ksm ?? 0,
      kpr: row.score_kpr ?? 0,
      kkb: row.score_kkb ?? 0,
    });
  }
  return map;
}

/**
 * Validasi jawaban admin edit — aturan identik submit (AC10, Bab 23):
 * semua pertanyaan wajib terjawab, option_id harus valid, tidak duplikat.
 */
export function validatePickedAnswers(
  questionIds: string[],
  validOptions: RatingOptionMap | NeedsOptionMap,
  answers: unknown,
): AnswersValidation {
  if (!Array.isArray(answers)) {
    return {
      ok: false,
      code: "INVALID_ANSWER",
      message: "Jawaban tidak valid. Silakan coba lagi.",
    };
  }

  const picked: PickedAnswers = {};
  for (const item of answers) {
    const answer = (item ?? {}) as { questionId?: unknown; optionId?: unknown };
    const questionId =
      typeof answer.questionId === "string" ? answer.questionId : "";
    const optionId = typeof answer.optionId === "string" ? answer.optionId : "";
    if (!questionIds.includes(questionId)) {
      return {
        ok: false,
        code: "INVALID_ANSWER",
        message: "Ada pertanyaan yang tidak dikenali. Silakan coba lagi.",
      };
    }
    if (picked[questionId] !== undefined) {
      return {
        ok: false,
        code: "INVALID_ANSWER",
        message: "Ada jawaban yang ganda. Silakan coba lagi.",
      };
    }
    const options = validOptions.get(questionId);
    if (!options || !options.has(optionId)) {
      return {
        ok: false,
        code: "INVALID_ANSWER",
        message: "Ada pilihan jawaban yang tidak valid. Silakan coba lagi.",
      };
    }
    picked[questionId] = optionId;
  }

  const missingQuestionIds = questionIds.filter((id) => !picked[id]);
  if (missingQuestionIds.length > 0) {
    return {
      ok: false,
      code: "INCOMPLETE_ANSWERS",
      message: "Belum semua pertanyaan dijawab.",
      missingQuestionIds,
    };
  }

  return { ok: true, picked };
}

/** Hitung ulang hasil RATING (Bab 8.1–8.3) dari jawaban terpilih. */
export function recalculateRating(
  picked: PickedAnswers,
  options: RatingOptionMap,
): RatingRecalculation {
  const scores: Record<string, number> = {};
  for (const [questionId, optionId] of Object.entries(picked)) {
    const option = options.get(questionId)?.get(optionId);
    if (option?.score != null) scores[questionId] = option.score;
  }

  const score = calculateRatingScore(scores);
  const rec = buildRatingRecommendation(score);

  return {
    finalScore: score.finalScore,
    persona: score.persona,
    readiness: score.readiness,
    ksmGate: rec.ksmGate,
    primaryRecommendation: rec.primaryRecommendation,
    secondaryRecommendation: rec.secondaryRecommendation ?? null,
    // Konsisten dengan jalur submit (POST /api/submissions).
    recommendationConfidence: rec.ksmGate ? "STRONG" : "MODERATE",
    financialGoal:
      options.get("Q13_RATING")?.get(picked["Q13_RATING"] ?? "")?.text ?? null,
    financialNeed:
      options.get("Q14_RATING")?.get(picked["Q14_RATING"] ?? "")?.text ?? null,
    dimensions: score.dimensions.map((d) => ({
      dimension: d.key,
      label: d.label,
      rawScore: d.rawScore,
      contribution: d.contribution,
      status: d.status,
    })),
  };
}

/** Hitung ulang hasil NEEDS (Bab 8.5) dari jawaban terpilih. */
export function recalculateNeeds(
  picked: PickedAnswers,
  options: NeedsOptionMap,
): NeedsRecalculation {
  const pointsByQuestion: Record<string, { ksm: number; kpr: number; kkb: number }> = {};
  for (const [questionId, optionId] of Object.entries(picked)) {
    const option = options.get(questionId)?.get(optionId);
    if (option) pointsByQuestion[questionId] = option;
  }

  const scores = sumNeedsScores(pointsByQuestion);
  const rec = buildNeedsRecommendation(scores, {
    // Sinyal tie-breaker = option_id terpilih (sama persis dengan POST).
    actualNeed: picked["Q7_NEEDS"] ?? null,
    urgency: picked["Q9_NEEDS"] ?? null,
    assetGap: picked["Q3_NEEDS"] ?? null,
    lifeStage: picked["Q1_NEEDS"] ?? null,
  });

  return {
    ksmScore: scores.ksm,
    kprScore: scores.kpr,
    kkbScore: scores.kkb,
    primaryRecommendation: rec.primary,
    secondaryRecommendation: rec.secondary ?? null,
    recommendationConfidence: rec.confidence,
  };
}

export function dimensionLabel(key: string): string {
  return DIMENSION_KEY_TO_LABEL[key as DimensionKey] ?? key;
}

// ---- Pemetaan confidence NEEDS di batas DB ----
// Engine (Bab 8.5) menghasilkan STRONG / RECOMMENDATION / DUAL, tetapi enum
// DB (Bab 12.3 + CHECK constraint `submission_recommendation_confidence_check`)
// hanya mengenal STRONG / MODERATE / DUAL / NONE. Nilai "RECOMMENDATION"
// disimpan sebagai "MODERATE" dan dikembalikan apa adanya ke "RECOMMENDATION"
// saat dibaca untuk tampilan. (Khusus NEEDS — untuk RATING, MODERATE memang
// nilai aslinya saat KSM Gate FAIL.)
export function needsConfidenceForDb(confidence: string): string {
  return confidence === "RECOMMENDATION" ? "MODERATE" : confidence;
}

export function needsConfidenceFromDb(
  confidence: string | null,
): string | null {
  return confidence === "MODERATE" ? "RECOMMENDATION" : confidence;
}
