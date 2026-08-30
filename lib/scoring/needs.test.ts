import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildNeedsRecommendation, sumNeedsScores } from "./needs";

describe("Financial Needs Scoring & Tie-Breaker (PRD Bab 8.5)", () => {
  it("AC6 — Strong Recommendation (selisih 12 >= 5 -> KSM, tanpa secondary)", () => {
    const rec = buildNeedsRecommendation({ ksm: 36, kpr: 24, kkb: 12 });
    assert.equal(rec.primary, "KSM");
    assert.equal(rec.secondary, null);
    assert.equal(rec.confidence, "STRONG");
    assert.equal(rec.isBalanced, false);
  });

  it("AC7 — Tie-Breaker by Actual Need (KSM=KPR=30, Q7=Rumah -> KPR)", () => {
    const rec = buildNeedsRecommendation(
      { ksm: 30, kpr: 30, kkb: 12 },
      { actualNeed: "Q7_NEEDS_b" }, // Rumah
    );
    assert.equal(rec.primary, "KPR");
    assert.equal(rec.usedTieBreaker, true);
    assert.equal(rec.confidence, "DUAL");
  });

  it("AC8 — No Strong Recommendation (28/29/27 -> KPR+KSM, copy berimbang)", () => {
    const rec = buildNeedsRecommendation({ ksm: 28, kpr: 29, kkb: 27 });
    assert.equal(rec.primary, "KPR");
    assert.equal(rec.secondary, "KSM");
    assert.equal(rec.confidence, "DUAL");
    assert.equal(rec.isBalanced, true);
    assert.equal(rec.usedTieBreaker, false);
  });

  it("Threshold: selisih 3-4 -> Recommendation (1 produk, confidence RECOMMENDATION)", () => {
    const rec = buildNeedsRecommendation({ ksm: 30, kpr: 27, kkb: 10 });
    assert.equal(rec.primary, "KSM");
    assert.equal(rec.secondary, null);
    assert.equal(rec.confidence, "RECOMMENDATION");
  });

  it("Threshold: selisih 1-2 -> Dual Recommendation (2 produk teratas)", () => {
    const rec = buildNeedsRecommendation({ ksm: 30, kpr: 28, kkb: 10 });
    assert.equal(rec.primary, "KSM");
    assert.equal(rec.secondary, "KPR");
    assert.equal(rec.confidence, "DUAL");
  });

  it("Selisih 4 tepat -> tetap Recommendation (bukan Dual)", () => {
    const rec = buildNeedsRecommendation({ ksm: 28, kpr: 24, kkb: 5 });
    assert.equal(rec.confidence, "RECOMMENDATION");
  });

  it("Selisih 5 tepat -> Strong", () => {
    const rec = buildNeedsRecommendation({ ksm: 30, kpr: 25, kkb: 5 });
    assert.equal(rec.confidence, "STRONG");
  });

  it("Tie 3 kategori persis + semua sinyal lemah -> Balanced (multi produk)", () => {
    const rec = buildNeedsRecommendation(
      { ksm: 25, kpr: 25, kkb: 25 },
      { actualNeed: "Q7_NEEDS_d", urgency: "Q9_NEEDS_c", assetGap: "Q3_NEEDS_d" },
    );
    assert.equal(rec.isBalanced, true);
    assert.equal(rec.confidence, "DUAL");
  });

  it("Tie-breaker berurutan: Actual Need tidak memisah -> Urgency memisah", () => {
    // Q7 jawaban netral (0), Q9 < 3 bulan -> KSM.
    const rec = buildNeedsRecommendation(
      { ksm: 22, kpr: 22, kkb: 22 },
      {
        actualNeed: "Q7_NEEDS_d", // Pendidikan -> rank 3 untuk KSM
        urgency: "Q9_NEEDS_a",
        assetGap: "Q3_NEEDS_a",
        lifeStage: "Q1_NEEDS_b",
      },
    );
    assert.equal(rec.primary, "KSM");
    assert.equal(rec.usedTieBreaker, true);
  });

  it("Tie-breaker: Urgency memisah KSM vs KPR saat actual need netral", () => {
    // actualNeed "UNANSWERED" -> skip; urgency Q9_c (6-12 bln) rank 2 -> KSM
    // vs KPR rank 0 -> KSM menang.
    const rec = buildNeedsRecommendation(
      { ksm: 20, kpr: 20, kkb: 9 },
      { actualNeed: "UNANSWERED", urgency: "Q9_NEEDS_c" },
    );
    assert.equal(rec.primary, "KSM");
    assert.equal(rec.usedTieBreaker, true);
  });

  it("Tie-breaker: Asset Gap memisah (Q3 kontrak -> KPR) saat Q7/Q9 netral", () => {
    const rec = buildNeedsRecommendation(
      { ksm: 20, kpr: 20, kkb: 9 },
      {
        actualNeed: "UNANSWERED",
        urgency: "UNANSWERED",
        assetGap: "Q3_NEEDS_c", // Kontrak/sewa -> gap rumah besar
      },
    );
    assert.equal(rec.primary, "KPR");
  });

  it("sumNeedsScores — raw sum dari 10 pertanyaan", () => {
    const points = {
      Q1_NEEDS: { ksm: 1, kpr: 1, kkb: 1 },
      Q2_NEEDS: { ksm: 1, kpr: 2, kkb: 2 },
      Q3_NEEDS: { ksm: 1, kpr: 5, kkb: 0 },
      Q4_NEEDS: { ksm: 0, kpr: 6, kkb: 0 },
      Q5_NEEDS: { ksm: 1, kpr: 1, kkb: 4 },
      Q6_NEEDS: { ksm: 0, kpr: 0, kkb: 5 },
      Q7_NEEDS: { ksm: 0, kpr: 6, kkb: 0 },
      Q8_NEEDS: { ksm: 3, kpr: 1, kkb: 1 },
      Q9_NEEDS: { ksm: 4, kpr: 3, kkb: 3 },
      Q10_NEEDS: { ksm: 0, kpr: 5, kkb: 0 },
    };
    const scores = sumNeedsScores(points);
    assert.deepEqual(scores, { ksm: 11, kpr: 30, kkb: 16 });
  });

  it("Skenario 6 (PRD) — KSM=36, KPR=24, KKB=12 -> STRONG KSM", () => {
    const rec = buildNeedsRecommendation({ ksm: 36, kpr: 24, kkb: 12 });
    assert.equal(rec.primary, "KSM");
    assert.equal(rec.confidence, "STRONG");
  });

  it("Skenario tie 2 kategori -> tie-breaker memilih berdasarkan actual need", () => {
    const rec = buildNeedsRecommendation(
      { ksm: 30, kpr: 30, kkb: 12 },
      { actualNeed: "Q7_NEEDS_b" },
    );
    assert.equal(rec.primary, "KPR");
  });
});
