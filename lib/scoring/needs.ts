// Mesin skor Financial Needs Assessment (F8, Bab 8.5) — murni & testable.
//
// Aturan wajib (PRD Bab 8.5, source of truth):
//  1. Skor akhir = raw sum per kategori (tanpa bobot tambahan — dikonfirmasi
//     client: "raw sum aja mas").
//  2. Cari skor tertinggi, cek selisih terhadap skor kedua:
//     - selisih >= 5  -> Strong Recommendation (1 produk)
//     - selisih 3–4   -> Recommendation (1 produk)
//     - selisih 1–2   -> Dual Recommendation (2 produk teratas)
//  3. Tie (skor sama persis) -> Tie-Breaker berurutan:
//     Actual Need (Q7) -> Urgency (Q9) -> Asset Gap (Q3/Q5) -> Life Stage (Q1).
//  4. Tidak bisa dibedakan ATAU ketiga skor berdekatan -> No Strong
//     Recommendation (tampilkan multi produk, copy "kebutuhan berimbang").

export type NeedsProduct = "KSM" | "KPR" | "KKB";

export type NeedsScores = {
  ksm: number;
  kpr: number;
  kkb: number;
};

/** Jawaban Q1-Q10 yang relevan untuk tie-breaker (Bab 8.5). */
export type NeedsTieBreakAnswers = {
  /** Life Stage (Q1) — supporting factor terakhir, bukan aturan umum. */
  lifeStage?: string | null;
  /** Actual Need (Q7) — prioritas tertinggi saat tie. */
  actualNeed?: string | null;
  /** Urgency (Q9) — makin cepat makin diprioritaskan. */
  urgency?: string | null;
  /** Existing Asset Gap (Q3/Q5) — makin besar gap makin diprioritaskan. */
  assetGap?: string | null;
};

export type NeedsRecommendationConfidence = "STRONG" | "RECOMMENDATION" | "DUAL";

export type NeedsRecommendation = {
  scores: NeedsScores;
  /** Produk dengan skor tertinggi. */
  primary: NeedsProduct;
  /** Produk kedua — ada saat Dual Recommendation (Bab 8.5: selisih 1–2). */
  secondary: NeedsProduct | null;
  confidence: NeedsRecommendationConfidence;
  /** True bila tie-breaker dipakai untuk memutuskan (Bab 8.5 poin 4). */
  usedTieBreaker: boolean;
  /** True bila tidak ada pemenang tunggal (copy "kebutuhan berimbang"). */
  isBalanced: boolean;
};

export const NEEDS_PRODUCTS: NeedsProduct[] = ["KSM", "KPR", "KKB"];

export function sumNeedsScores(
  pointsByQuestion: Record<string, { ksm: number; kpr: number; kkb: number }>,
): NeedsScores {
  const scores: NeedsScores = { ksm: 0, kpr: 0, kkb: 0 };
  for (const points of Object.values(pointsByQuestion)) {
    scores.ksm += points.ksm;
    scores.kpr += points.kpr;
    scores.kkb += points.kkb;
  }
  return scores;
}

function rankByScore(scores: NeedsScores): NeedsProduct[] {
  return [...NEEDS_PRODUCTS].sort(
    (a, b) => scores[b.toLowerCase() as keyof NeedsScores] - scores[a.toLowerCase() as keyof NeedsScores],
  );
}

function scoreOf(scores: NeedsScores, product: NeedsProduct): number {
  return scores[product.toLowerCase() as keyof NeedsScores];
}

/** Peringkat keputusan tie-breaker untuk SATU produk (Bab 8.5). */
function tieBreakRank(
  product: NeedsProduct,
  answers: NeedsTieBreakAnswers,
  breaker: "actualNeed" | "urgency" | "assetGap" | "lifeStage",
): number {
  switch (breaker) {
    case "actualNeed": {
      // Q7: kebutuhan keluarga/pendidikan/liburan/usaha -> KSM, rumah -> KPR,
      // kendaraan -> KKB. Prioritas tinggi saat KSM/KPR/KKB sama persis.
      const need = answers.actualNeed;
      if (!need || need === "UNANSWERED") return 0;
      if (need === "Q7_NEEDS_a" || need === "Q7_NEEDS_d" || need === "Q7_NEEDS_e" || need === "Q7_NEEDS_f") {
        return product === "KSM" ? 3 : 0;
      }
      if (need === "Q7_NEEDS_b") return product === "KPR" ? 3 : 0;
      if (need === "Q7_NEEDS_c") return product === "KKB" ? 3 : 0;
      return 0;
    }
    case "urgency": {
      // Q9: makin cepat (< 3 bulan) makin diprioritaskan.
      const urgency = answers.urgency;
      if (!urgency || urgency === "UNANSWERED") return 0;
      const base =
        urgency === "Q9_NEEDS_a" ? 4 :
        urgency === "Q9_NEEDS_b" ? 3 :
        urgency === "Q9_NEEDS_c" ? 2 : 1;
      return product === "KSM" ? base : 0;
    }
    case "assetGap": {
      const gap = answers.assetGap;
      if (!gap || gap === "UNANSWERED") return 0;
      if (gap.startsWith("Q3_NEEDS_")) {
        // Gap rumah besar -> KPR.
        const rank =
          gap === "Q3_NEEDS_a" || gap === "Q3_NEEDS_c" ? 3 :
          gap === "Q3_NEEDS_b" || gap === "Q3_NEEDS_e" ? 2 : 0;
        return product === "KPR" ? rank : 0;
      }
      if (gap.startsWith("Q5_NEEDS_")) {
        // Gap kendaraan -> KKB.
        const rank = gap === "Q5_NEEDS_a" ? 2 : gap === "Q5_NEEDS_b" ? 1 : 0;
        return product === "KKB" ? rank : 0;
      }
      return 0;
    }
    case "lifeStage": {
      // Q1 — hanya supporting factor terakhir (bukan aturan umum).
      const stage = answers.lifeStage;
      if (!stage || stage === "UNANSWERED") return 0;
      const rank = stage === "Q1_NEEDS_c" ? 3 : stage === "Q1_NEEDS_b" ? 2 : 0;
      return product === "KSM" ? rank : 0;
    }
  }
}

/**
 * Menentukan rekomendasi (Bab 8.5 urutan wajib):
 * skor tertinggi jelas (selisih >= 5 / 3-4 / 1-2) -> produk/double,
 * tie persis -> tie-breaker berurutan, sisanya -> no strong recommendation.
 */
export function buildNeedsRecommendation(
  scores: NeedsScores,
  answers: NeedsTieBreakAnswers = {},
): NeedsRecommendation {
  const ranked = rankByScore(scores);
  const top = ranked[0];
  const second = ranked[1];
  const diff = scoreOf(scores, top) - scoreOf(scores, second);

  if (diff >= 5) {
    return {
      scores,
      primary: top,
      secondary: null,
      confidence: "STRONG",
      usedTieBreaker: false,
      isBalanced: false,
    };
  }

  if (diff >= 3) {
    return {
      scores,
      primary: top,
      secondary: null,
      confidence: "RECOMMENDATION",
      usedTieBreaker: false,
      isBalanced: false,
    };
  }

  if (diff >= 1) {
    return {
      scores,
      primary: top,
      secondary: second,
      confidence: "DUAL",
      usedTieBreaker: false,
      isBalanced: true,
    };
  }

  // ---- Skor sama persis (diff === 0) -> Tie-Breaker Rule (Bab 8.5 poin 4) ----
  const tied = ranked.filter((p) => scoreOf(scores, p) === scoreOf(scores, top));
  const tieBreakers: Array<"actualNeed" | "urgency" | "assetGap" | "lifeStage"> = [
    "actualNeed",
    "urgency",
    "assetGap",
    "lifeStage",
  ];

  for (const breaker of tieBreakers) {
    const ranks = new Map(
      tied.map((p) => [p, tieBreakRank(p, answers, breaker)] as const),
    );
    const maxRank = Math.max(...ranks.values());
    if (maxRank <= 0) continue; // jawaban tidak memberi sinyal utk breaker ini

    const winners = tied.filter((p) => ranks.get(p) === maxRank);
    if (winners.length === 1) {
      // Tie-breaker berhasil memisahkan satu pemenang.
      const runnerUp = tied.find((p) => p !== winners[0]) ?? null;
      return {
        scores,
        primary: winners[0],
        secondary: runnerUp,
        confidence: "DUAL",
        usedTieBreaker: true,
        isBalanced: true,
      };
    }
    // Masih imbang di breaker ini -> lanjut ke breaker berikutnya.
  }

  // Tie-breaker tidak berhasil memisahkan -> No Strong Recommendation,
  // tampilkan dua produk teratas dengan copy "kebutuhan berimbang" (Bab 8.5).
  // `second` hanya dipakai saat tie melibatkan 2 produk; untuk tie 3 arah semua
  // skor sama, tampilkan dua produk pertama yang paling relevan (KSM & KPR).
  const balancedSecondary =
    tied.length === 2 ? second : NEEDS_PRODUCTS[1];
  return {
    scores,
    primary: top,
    secondary: balancedSecondary,
    confidence: "DUAL",
    usedTieBreaker: true,
    isBalanced: true,
  };
}
