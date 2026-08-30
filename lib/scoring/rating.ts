import {
  DIMENSIONS,
  type DimensionResult,
  type DimensionStatus,
  type Persona,
  type RatingScoreResult,
  type Readiness,
} from "./constants";

export function clampScore(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function classifyDimension(score: number): DimensionStatus {
  if (score >= 80) return "STRONG";
  if (score >= 65) return "GOOD";
  if (score >= 40) return "IMPROVE";
  return "PRIORITY";
}

export function classifyPersona(finalScore: number): Persona {
  if (finalScore >= 85) return "THE_ARCHITECT";
  if (finalScore >= 70) return "THE_BUILDER";
  if (finalScore >= 55) return "THE_EXPLORER";
  if (finalScore >= 40) return "THE_ADVENTURER";
  return "THE_STARTER";
}

export function classifyReadiness(finalScore: number): Readiness {
  if (finalScore >= 70) return "HIGH";
  if (finalScore >= 55) return "MEDIUM";
  return "LOW";
}

/**
 * Menghitung skor Financial Rating dari jawaban scoring (Q1-Q12).
 * `scores` = map dari question_id -> nilai opsi (score_rating).
 * Formula wajib persis Bab 8.1: raw score = rata-rata 2 soal, contribution = raw × bobot,
 * final score = ROUND(jumlah contribution), clamp 0-100.
 */
export function calculateRatingScore(
  scores: Record<string, number>,
): RatingScoreResult {
  const dimensions: DimensionResult[] = DIMENSIONS.map((dim) => {
    const [q1, q2] = dim.questionIds;
    const s1 = scores[q1] ?? 0;
    const s2 = scores[q2] ?? 0;
    const rawScore = (s1 + s2) / 2;
    const contribution = rawScore * dim.weight;
    return {
      key: dim.key,
      label: dim.label,
      rawScore,
      contribution,
      status: classifyDimension(rawScore),
    };
  });

  const total = dimensions.reduce((sum, d) => sum + d.contribution, 0);
  const finalScore = clampScore(Math.round(total));

  return {
    finalScore,
    persona: classifyPersona(finalScore),
    readiness: classifyReadiness(finalScore),
    dimensions,
  };
}
