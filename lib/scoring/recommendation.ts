import type { DimensionKey, RatingScoreResult } from "./constants";

export type RecommendationPath = "KSM" | "CASA" | "LIVIN" | "DEBT_ADVICE" | "FINANCIAL_ADVICE";

export interface RatingRecommendation {
  ksmGate: boolean;
  primaryRecommendation: RecommendationPath;
  secondaryRecommendation?: "LIVIN";
  /** Jumlah dimensi dengan skor < 40 (untuk Path E). */
  weakestDimension?: DimensionKey;
  dimensionsBelow40: DimensionKey[];
}

function dimensionScore(result: RatingScoreResult, key: DimensionKey): number {
  const dim = result.dimensions.find((d) => d.key === key);
  return dim ? dim.rawScore : 0;
}

const PRIORITY_ORDER: DimensionKey[] = [
  "debt_management",
  "cash_flow",
  "emergency_fund",
  "saving_habit",
  "financial_protection",
  "investment_habit",
];

/**
 * KSM Gate (Bab 8.2): PASS hanya jika SEMUA terpenuhi.
 * Final Score >= 70 AND Cash Flow >= 60 AND Debt >= 60 AND Emergency Fund >= 40.
 */
export function evaluateKsmGate(result: RatingScoreResult): boolean {
  if (result.finalScore < 70) return false;
  if (dimensionScore(result, "cash_flow") < 60) return false;
  if (dimensionScore(result, "debt_management") < 60) return false;
  if (dimensionScore(result, "emergency_fund") < 40) return false;
  return true;
}

/**
 * Recommendation engine (Bab 8.3) setelah KSM Gate.
 * Path A-E dengan Priority Rule (Bab 8.3 + Priority Rule Bab 12 dokumen).
 */
export function buildRatingRecommendation(
  result: RatingScoreResult,
): RatingRecommendation {
  const ksmGate = evaluateKsmGate(result);

  const dimensionsBelow40 = result.dimensions
    .filter((d) => d.rawScore < 40)
    .map((d) => d.key);

  if (ksmGate) {
    return {
      ksmGate: true,
      primaryRecommendation: "KSM",
      dimensionsBelow40,
    };
  }

  // Path E: >= 2 dimensi < 40 -> jangan push produk spesifik.
  if (dimensionsBelow40.length >= 2) {
    return {
      ksmGate: false,
      primaryRecommendation: "FINANCIAL_ADVICE",
      dimensionsBelow40,
    };
  }

  const cashFlow = dimensionScore(result, "cash_flow");
  const debt = dimensionScore(result, "debt_management");
  const emergencyFund = dimensionScore(result, "emergency_fund");
  const saving = dimensionScore(result, "saving_habit");

  // Urutan prioritas dimensi yang bermasalah (Priority Rule), hanya untuk skor < 40.
  const weakest = PRIORITY_ORDER.find((key) => dimensionScore(result, key) < 40);

  // Path D: Debt Management < 60 -> Debt Advice (dapat dilanjutkan ke Livin').
  if (debt < 60) {
    return {
      ksmGate: false,
      primaryRecommendation: "DEBT_ADVICE",
      secondaryRecommendation: "LIVIN",
      weakestDimension: weakest,
      dimensionsBelow40,
    };
  }

  // Path C: Cash Flow < 60 -> Livin'.
  if (cashFlow < 60) {
    return {
      ksmGate: false,
      primaryRecommendation: "LIVIN",
      weakestDimension: weakest,
      dimensionsBelow40,
    };
  }

  // Path B: Emergency Fund < 60 atau Saving Habit < 60 -> CASA/Saving.
  // Prioritaskan Emergency Fund bila keduanya bermasalah.
  if (emergencyFund < 60 || saving < 60) {
    return {
      ksmGate: false,
      primaryRecommendation: "CASA",
      weakestDimension: emergencyFund < 60 ? "emergency_fund" : "saving_habit",
      dimensionsBelow40,
    };
  }

  // Fallback (seharusnya jarang): tidak ada masalah spesifik, arahkan ke CASA.
  return {
    ksmGate: false,
    primaryRecommendation: "CASA",
    dimensionsBelow40,
  };
}
