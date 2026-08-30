import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canAccessDashboard } from "./access";
import { buildAuditChange, buildDeleteSnapshot } from "./audit";

// AC9 — Admin Dashboard Access Control (PRD Bab 26):
// "Given seseorang belum login sebagai admin, When mencoba mengakses
// /admin/dashboard, Then sistem redirect ke halaman login, tidak
// menampilkan data submission apapun."
// Keputusan akses diuji sebagai fungsi murni (lihat access.ts).

describe("AC9 — Admin Dashboard Access Control", () => {
  it("Belum login (tanpa session) -> ditolak, alasan NOT_AUTHENTICATED", () => {
    const decision = canAccessDashboard({
      authenticated: false,
      hasAdminProfile: false,
    });
    assert.equal(decision.allowed, false);
    if (!decision.allowed) assert.equal(decision.reason, "NOT_AUTHENTICATED");
  });

  it("Sudah login tapi bukan admin (tanpa admin_profile) -> ditolak, alasan NOT_ADMIN", () => {
    const decision = canAccessDashboard({
      authenticated: true,
      hasAdminProfile: false,
    });
    assert.equal(decision.allowed, false);
    if (!decision.allowed) assert.equal(decision.reason, "NOT_ADMIN");
  });

  it("Login + punya profil admin -> diizinkan", () => {
    const decision = canAccessDashboard({
      authenticated: true,
      hasAdminProfile: true,
    });
    assert.deepEqual(decision, { allowed: true, reason: "OK" });
  });
});

describe("Audit log — buildAuditChange (PRD Bab 25)", () => {
  it("Tidak ada perubahan -> changed=false, tanpa isi", () => {
    const before = {
      customerName: "Budi",
      customerPhone: "6281234567890",
      finalScore: 78,
      persona: "THE_BUILDER",
      primaryRecommendation: "KSM",
    };
    const change = buildAuditChange(before, { ...before }, { Q1: "a" }, { Q1: "a" });
    assert.equal(change.changed, false);
    assert.equal(change.oldValue, null);
    assert.equal(change.newValue, null);
  });

  it("Ganti nama + nomor HP -> hanya field yang berubah tercatat before/after", () => {
    const change = buildAuditChange(
      { customerName: "Budi", customerPhone: "6281234567890", finalScore: 78 },
      { customerName: "Budi Santoso", customerPhone: "6281299999999", finalScore: 78 },
    );
    assert.equal(change.changed, true);
    const oldValue = change.oldValue as Record<string, unknown>;
    const newValue = change.newValue as Record<string, unknown>;
    // final_score tidak berubah -> tidak ikut tercatat
    assert.equal(oldValue["finalScore"], undefined);
    assert.deepEqual(oldValue, {
      customerName: "Budi",
      customerPhone: "6281234567890",
    });
    assert.deepEqual(newValue, {
      customerName: "Budi Santoso",
      customerPhone: "6281299999999",
    });
  });

  it("Jawaban berubah -> tercatat sebagai field 'answers' (map lama & baru)", () => {
    const change = buildAuditChange(
      { customerName: "Budi" },
      { customerName: "Budi" },
      { Q1_RATING: "A", Q2_RATING: "B" },
      { Q1_RATING: "C", Q2_RATING: "B" },
    );
    assert.equal(change.changed, true);
    assert.deepEqual(change.oldValue, { answers: { Q1_RATING: "A", Q2_RATING: "B" } });
    assert.deepEqual(change.newValue, { answers: { Q1_RATING: "C", Q2_RATING: "B" } });
  });

  it("Jawaban sama urutan berbeda (tidak ada perubahan semantik) -> tidak tercatat", () => {
    const change = buildAuditChange(
      {},
      {},
      { Q2_RATING: "B", Q1_RATING: "A" },
      { Q1_RATING: "A", Q2_RATING: "B" },
    );
    assert.equal(change.changed, false);
  });

  it("Edit jawaban mengubah skor -> field skor ikut tercatat before/after", () => {
    const change = buildAuditChange(
      { finalScore: 78, persona: "THE_BUILDER", ksmGate: true, primaryRecommendation: "KSM" },
      { finalScore: 74, persona: "THE_BUILDER", ksmGate: false, primaryRecommendation: "DEBT_ADVICE" },
    );
    assert.deepEqual(change.oldValue, {
      finalScore: 78,
      ksmGate: true,
      primaryRecommendation: "KSM",
    });
    assert.deepEqual(change.newValue, {
      finalScore: 74,
      ksmGate: false,
      primaryRecommendation: "DEBT_ADVICE",
    });
  });

  it("buildDeleteSnapshot -> snapshot lengkap field utama untuk audit DELETE", () => {
    const snapshot = buildDeleteSnapshot({
      assessmentType: "RATING",
      customerName: "Budi",
      customerPhone: "6281234567890",
      finalScore: 78,
      persona: "THE_BUILDER",
      primaryRecommendation: "KSM",
    });
    assert.equal(snapshot.assessmentType, "RATING");
    assert.equal(snapshot.customerName, "Budi");
    assert.equal(snapshot.finalScore, 78);
    assert.equal(snapshot.ksmScore, null); // field yang tak terisi -> null eksplisit
  });
});
