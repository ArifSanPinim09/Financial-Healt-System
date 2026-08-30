import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DIMENSION_KEY_TO_LABEL,
  type DimensionKey,
} from "@/lib/scoring/constants";

// GET /api/result?id=<submission_id> — hasil assessment (F6 / F9).
// Publik, tapi query lewat service-role di server karena RLS melarang read
// publik ke tabel submission (PRD Bab 23). submission_id adalah UUID yang
// tidak dapat ditebak → akses praktis hanya untuk pemilik id-nya (pola
// "capability URL"). Hanya mengembalikan field untuk tampilan hasil — tanpa
// jawaban mentah maupun nomor HP nasabah.
//
// Dipakai oleh halaman result untuk dua alur:
//  1. Sesudah submit → nasabah melihat hasil baru.
//  2. F14 → nomor yang sudah pernah submit di-redirect ke hasil lama (sesi
//     baru, tidak ada data di client), jadi hasil wajib diambil dari DB.
//
// RATING → skor + persona + dimensi (F6). NEEDS → skor KSM/KPR/KKB +
// rekomendasi 1/2 produk (F9).

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function dimensionLabel(key: string): string {
  return DIMENSION_KEY_TO_LABEL[key as DimensionKey] ?? key;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return errorResponse(400, "MISSING_ID", "Hasil assessment tidak ditemukan.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submission")
    .select(
      "submission_id, customer_name, assessment_type, final_score, persona, readiness, ksm_gate, primary_recommendation, secondary_recommendation, recommendation_confidence, financial_goal, financial_need, ksm_score, kpr_score, kkb_score",
    )
    .eq("submission_id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    console.error("[result] query submission gagal:", error.message);
    return errorResponse(
      500,
      "INTERNAL",
      "Terjadi gangguan saat mengambil hasil. Coba lagi ya.",
    );
  }
  if (!data) {
    return errorResponse(
      404,
      "NOT_FOUND",
      "Hasil assessment tidak ditemukan atau sudah dihapus.",
    );
  }

  if (data.assessment_type === "NEEDS") {
    return NextResponse.json({
      submissionId: data.submission_id,
      customerName: data.customer_name,
      assessmentType: "NEEDS",
      result: {
        primaryRecommendation: data.primary_recommendation,
        secondaryRecommendation: data.secondary_recommendation,
        recommendationConfidence: data.recommendation_confidence,
        ksmScore: data.ksm_score ?? 0,
        kprScore: data.kpr_score ?? 0,
        kkbScore: data.kkb_score ?? 0,
      },
    });
  }

  const { data: dims } = await supabase
    .from("dimension_result")
    .select("dimension, raw_score, contribution, status")
    .eq("submission_id", data.submission_id);

  return NextResponse.json({
    submissionId: data.submission_id,
    customerName: data.customer_name,
    assessmentType: "RATING",
    result: {
      finalScore: data.final_score ?? 0,
      persona: data.persona ?? "",
      readiness: data.readiness ?? "",
      ksmGate: data.ksm_gate ?? false,
      primaryRecommendation: data.primary_recommendation,
      secondaryRecommendation: data.secondary_recommendation,
      recommendationConfidence: data.recommendation_confidence,
      financialGoal: data.financial_goal,
      financialNeed: data.financial_need,
      dimensions: (dims ?? []).map((d) => ({
        dimension: d.dimension,
        label: dimensionLabel(d.dimension),
        rawScore: d.raw_score,
        contribution: d.contribution,
        status: d.status,
      })),
    },
  });
}
