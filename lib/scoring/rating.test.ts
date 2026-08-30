import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateRatingScore,
  classifyPersona,
  classifyReadiness,
} from "./rating";
import { buildRatingRecommendation } from "./recommendation";

describe("Financial Rating Scoring (PRD Bab 8)", () => {
  it("AC1 — perhitungan final score 77.75 dibulatkan 78", () => {
    const scores = {
      Q1_RATING: 100, Q2_RATING: 80, // Cash Flow 90
      Q3_RATING: 85, Q4_RATING: 90, // Debt 87.5
      Q5_RATING: 65, Q6_RATING: 35, // Emergency Fund 50
      Q7_RATING: 100, Q8_RATING: 80, // Saving 90
      Q9_RATING: 65, Q10_RATING: 80, // Investment 72.5
      Q11_RATING: 60, Q12_RATING: 80, // Protection 70
    };
    const result = calculateRatingScore(scores);
    assert.equal(result.finalScore, 78);
  });

  it("AC2 — persona THE BUILDER untuk final score 74", () => {
    assert.equal(classifyPersona(74), "THE_BUILDER");
  });

  it("Persona & Readiness boundary (85 -> ARCHITECT, 70 -> BUILDER, 55 -> EXPLORER, 40 -> ADVENTURER, 39 -> STARTER)", () => {
    assert.equal(classifyPersona(85), "THE_ARCHITECT");
    assert.equal(classifyPersona(70), "THE_BUILDER");
    assert.equal(classifyPersona(55), "THE_EXPLORER");
    assert.equal(classifyPersona(40), "THE_ADVENTURER");
    assert.equal(classifyPersona(39), "THE_STARTER");
  });

  it("Readiness boundary (70 HIGH, 55 MEDIUM, 54 LOW)", () => {
    assert.equal(classifyReadiness(70), "HIGH");
    assert.equal(classifyReadiness(55), "MEDIUM");
    assert.equal(classifyReadiness(54), "LOW");
  });

  it("AC3 — KSM Gate PASS (final 78, CF 85, Debt 75, EF 50)", () => {
    const result = calculateRatingScore({
      Q1_RATING: 85, Q2_RATING: 85, // CF 85
      Q3_RATING: 75, Q4_RATING: 75, // Debt 75
      Q5_RATING: 50, Q6_RATING: 50, // EF 50
      Q7_RATING: 80, Q8_RATING: 80, // Saving 80
      Q9_RATING: 60, Q10_RATING: 60, // Inv 60
      Q11_RATING: 70, Q12_RATING: 70, // Prot 70
    });
    const rec = buildRatingRecommendation(result);
    assert.equal(rec.ksmGate, true);
    assert.equal(rec.primaryRecommendation, "KSM");
  });

  it("AC4 — KSM Gate FAIL walau final score tinggi (Debt 32 < 60)", () => {
    const result = calculateRatingScore({
      Q1_RATING: 85, Q2_RATING: 85, // CF 85
      Q3_RATING: 32, Q4_RATING: 32, // Debt 32
      Q5_RATING: 80, Q6_RATING: 80, // EF 80
      Q7_RATING: 90, Q8_RATING: 90, // Saving 90
      Q9_RATING: 70, Q10_RATING: 70, // Inv 70
      Q11_RATING: 80, Q12_RATING: 80, // Prot 80
    });
    const rec = buildRatingRecommendation(result);
    assert.equal(rec.ksmGate, false);
    assert.equal(rec.primaryRecommendation, "DEBT_ADVICE");
    assert.equal(rec.secondaryRecommendation, "LIVIN");
  });

  it("AC5 — Financial Goal tidak override Readiness (final 52 LOW)", () => {
    const result = calculateRatingScore({
      Q1_RATING: 52, Q2_RATING: 52,
      Q3_RATING: 52, Q4_RATING: 52,
      Q5_RATING: 52, Q6_RATING: 52,
      Q7_RATING: 52, Q8_RATING: 52,
      Q9_RATING: 52, Q10_RATING: 52,
      Q11_RATING: 52, Q12_RATING: 52,
    });
    assert.equal(result.readiness, "LOW");
    const rec = buildRatingRecommendation(result);
    // Goal tidak dipakai di sini; readiness LOW berarti tidak KSM.
    assert.notEqual(rec.primaryRecommendation, "KSM");
  });

  it("Path B — Emergency Fund & Saving < 60 -> CASA, prioritas Emergency Fund", () => {
    const result = calculateRatingScore({
      Q1_RATING: 80, Q2_RATING: 80,
      Q3_RATING: 80, Q4_RATING: 80,
      Q5_RATING: 30, Q6_RATING: 30, // EF 30
      Q7_RATING: 40, Q8_RATING: 40, // Saving 40
      Q9_RATING: 80, Q10_RATING: 80,
      Q11_RATING: 80, Q12_RATING: 80,
    });
    const rec = buildRatingRecommendation(result);
    assert.equal(rec.primaryRecommendation, "CASA");
    assert.equal(rec.weakestDimension, "emergency_fund");
  });

  it("Path C — Cash Flow < 60 -> Livin'", () => {
    const result = calculateRatingScore({
      Q1_RATING: 40, Q2_RATING: 40, // CF 40
      Q3_RATING: 70, Q4_RATING: 70,
      Q5_RATING: 70, Q6_RATING: 70,
      Q7_RATING: 70, Q8_RATING: 70,
      Q9_RATING: 70, Q10_RATING: 70,
      Q11_RATING: 70, Q12_RATING: 70,
    });
    const rec = buildRatingRecommendation(result);
    assert.equal(rec.primaryRecommendation, "LIVIN");
  });

  it("Path E — >= 2 dimensi < 40 -> Financial Advice (jangan push produk)", () => {
    const result = calculateRatingScore({
      Q1_RATING: 30, Q2_RATING: 30, // CF 30 (<40)
      Q3_RATING: 30, Q4_RATING: 30, // Debt 30 (<40)
      Q5_RATING: 30, Q6_RATING: 30,
      Q7_RATING: 30, Q8_RATING: 30,
      Q9_RATING: 30, Q10_RATING: 30,
      Q11_RATING: 30, Q12_RATING: 30,
    });
    const rec = buildRatingRecommendation(result);
    assert.equal(rec.primaryRecommendation, "FINANCIAL_ADVICE");
    assert.ok(rec.dimensionsBelow40.length >= 2);
  });
});
