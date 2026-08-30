import { NextResponse } from "next/server";
import {
  buildAuditChange,
  buildDeleteSnapshot,
  type SubmissionSnapshot,
} from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/auth";
import {
  buildNeedsOptionMap,
  buildRatingOptionMap,
  dimensionLabel,
  needsConfidenceForDb,
  recalculateNeeds,
  recalculateRating,
  validatePickedAnswers,
  type PickedAnswers,
} from "@/lib/submissions/compute";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/database.types";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";

// /api/submissions/:id — Bab 22 (admin, Supabase session) & F10.
//  - GET    : detail lengkap 1 submission (data + jawaban + audit log).
//  - PATCH  : admin edit nama/no HP/jawaban. Skor & rekomendasi dihitung
//             ulang di server dengan engine yang sama dengan submit
//             (deterministik, Bab 24). Audit log WAJIB (Bab 25).
//  - DELETE : soft-delete (deleted_at, Bab F10/12.3) + audit log WAJIB (Bab 25).

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

type RouteContext = { params: Promise<{ id: string }> };

async function resolveAdminEmails(
  supabase: ReturnType<typeof createAdminClient>,
  adminIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const id of new Set(adminIds)) {
    const { data } = await supabase.auth.admin.getUserById(id);
    if (data.user?.email) map.set(id, data.user.email);
  }
  return map;
}

/** Muat seluruh data untuk payload detail (dipakai GET & hasil PATCH). */
async function buildDetailPayload(
  supabase: ReturnType<typeof createAdminClient>,
  submissionId: string,
) {
  const { data: row, error: rowError } = await supabase
    .from("submission")
    .select("*")
    .eq("submission_id", submissionId)
    .is("deleted_at", null)
    .maybeSingle();
  if (rowError || !row) {
    return { error: rowError, row: null as (typeof row & object) | null };
  }

  const { data: questionRows } = await supabase
    .from("question_bank")
    .select("question_id, dimension, question_text, order_index, is_scoring")
    .eq("assessment_type", row.assessment_type)
    .order("order_index");

  const questionIds = (questionRows ?? []).map((q) => q.question_id);

  const { data: optionRows } = await supabase
    .from("question_option")
    .select("option_id, question_id, option_text, option_detail")
    .in("question_id", questionIds);

  const { data: answerRows } = await supabase
    .from("submission_answer")
    .select("question_id, option_id")
    .eq("submission_id", submissionId);

  const answers: PickedAnswers = {};
  for (const a of answerRows ?? []) answers[a.question_id] = a.option_id;

  let dimensions:
    | {
        dimension: string;
        label: string;
        rawScore: number;
        contribution: number;
        status: string;
      }[]
    | null = null;
  if (row.assessment_type === "RATING") {
    const { data: dimRows } = await supabase
      .from("dimension_result")
      .select("dimension, raw_score, contribution, status")
      .eq("submission_id", submissionId)
      .order("raw_score", { ascending: false });
    dimensions = (dimRows ?? []).map((d) => ({
      dimension: d.dimension,
      label: dimensionLabel(d.dimension),
      rawScore: d.raw_score,
      contribution: d.contribution,
      status: d.status,
    }));
  }

  const { data: auditRows } = await supabase
    .from("submission_audit_log")
    .select("id, action, admin_id, old_value, new_value, created_at")
    .eq("submission_id", submissionId)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(50);

  const adminEmails = await resolveAdminEmails(
    supabase,
    (auditRows ?? []).map((a) => a.admin_id),
  );

  const questions = (questionRows ?? []).map((q) => ({
    questionId: q.question_id,
    questionText: q.question_text,
    dimension: q.dimension,
    orderIndex: q.order_index,
    isScoring: q.is_scoring,
    options: (optionRows ?? [])
      .filter((o) => o.question_id === q.question_id)
      .map((o) => ({
        optionId: o.option_id,
        optionText: o.option_text,
        optionDetail: o.option_detail,
      })),
  }));

  return {
    error: null,
    row,
    payload: {
      submission: {
        submissionId: row.submission_id,
        assessmentType: row.assessment_type,
        customerName: row.customer_name,
        customerPhone: row.customer_phone,
        submittedAt: row.submitted_at,
        updatedAt: row.updated_at,
        finalScore: row.final_score,
        persona: row.persona,
        readiness: row.readiness,
        ksmGate: row.ksm_gate,
        ksmScore: row.ksm_score,
        kprScore: row.kpr_score,
        kkbScore: row.kkb_score,
        financialGoal: row.financial_goal,
        financialNeed: row.financial_need,
        primaryRecommendation: row.primary_recommendation,
        secondaryRecommendation: row.secondary_recommendation,
        recommendationConfidence: row.recommendation_confidence,
      },
      questions,
      answers,
      dimensions,
      auditLog: (auditRows ?? []).map((a) => ({
        id: a.id,
        action: a.action,
        adminId: a.admin_id,
        adminEmail: adminEmails.get(a.admin_id) ?? "admin",
        oldValue: a.old_value,
        newValue: a.new_value,
        createdAt: a.created_at,
      })),
    },
  };
}

function snapshotOf(row: {
  assessment_type: string;
  customer_name: string;
  customer_phone: string;
  submitted_at: string | null;
  final_score: number | null;
  persona: string | null;
  readiness: string | null;
  ksm_gate: boolean | null;
  ksm_score: number | null;
  kpr_score: number | null;
  kkb_score: number | null;
  financial_goal: string | null;
  financial_need: string | null;
  primary_recommendation: string;
  secondary_recommendation: string | null;
  recommendation_confidence: string;
}): SubmissionSnapshot {
  return {
    assessmentType: row.assessment_type,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    submittedAt: row.submitted_at,
    finalScore: row.final_score,
    persona: row.persona,
    readiness: row.readiness,
    ksmGate: row.ksm_gate,
    ksmScore: row.ksm_score,
    kprScore: row.kpr_score,
    kkbScore: row.kkb_score,
    financialGoal: row.financial_goal,
    financialNeed: row.financial_need,
    primaryRecommendation: row.primary_recommendation,
    secondaryRecommendation: row.secondary_recommendation,
    recommendationConfidence: row.recommendation_confidence,
  };
}

// ---------------------------------------------------------------------------
// GET — detail 1 submission (Bab 22, F10). 404 bila tidak ada/terhapus.
// ---------------------------------------------------------------------------
export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return errorResponse(401, "UNAUTHORIZED", "Masuk sebagai admin dulu ya.");
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return errorResponse(404, "NOT_FOUND", "Data tidak ditemukan.");
  }

  const supabase = createAdminClient();
  const detail = await buildDetailPayload(supabase, id);
  if (detail.error || !detail.row) {
    if (detail.error) console.error("[submissions:id] gagal memuat detail:", detail.error);
    return errorResponse(404, "NOT_FOUND", "Data tidak ditemukan.");
  }

  return NextResponse.json(detail.payload);
}

// ---------------------------------------------------------------------------
// PATCH — admin edit (Bab F10, 25).
// Body: { name?, phone?, answers?: [{ questionId, optionId }] }
// - name/phone: validasi format (Bab F13), phone dinormalisasi (F14).
// - answers: wajib lengkap & valid (AC10) -> skor dihitung ulang di server.
// - Perubahan nama/phone/jawaban + hasil terhitung yang ikut berubah ->
//   audit log (Bab 25, WAJIB) + updated_at/updated_by (Bab 12.3).
// ---------------------------------------------------------------------------
export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return errorResponse(401, "UNAUTHORIZED", "Masuk sebagai admin dulu ya.");
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return errorResponse(404, "NOT_FOUND", "Data tidak ditemukan.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Body request tidak valid.");
  }

  const { name, phone, answers } = (body ?? {}) as {
    name?: unknown;
    phone?: unknown;
    answers?: unknown;
  };

  const supabase = createAdminClient();

  const { data: row, error: rowError } = await supabase
    .from("submission")
    .select("*")
    .eq("submission_id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (rowError || !row) {
    if (rowError) console.error("[submissions:id] gagal memuat row:", rowError);
    return errorResponse(404, "NOT_FOUND", "Data tidak ditemukan.");
  }

  // ---- Siapkan nilai baru ----
  const nextName =
    typeof name === "string" && name.trim() ? name.trim() : row.customer_name;
  if (nextName !== row.customer_name && nextName.length < 2) {
    return errorResponse(400, "INVALID_INPUT", "Nama minimal 2 huruf.");
  }

  const phoneRaw = typeof phone === "string" ? phone.trim() : "";
  let nextPhone = row.customer_phone;
  if (phoneRaw && phoneRaw !== row.customer_phone) {
    const normalized = normalizeIndonesianPhone(phoneRaw);
    if (!normalized) {
      return errorResponse(
        400,
        "INVALID_PHONE",
        "Nomor HP tidak valid. Gunakan format Indonesia (08xx atau +62).",
      );
    }
    nextPhone = normalized;

    // Konflik unique (customer_phone, assessment_type) dengan submission
    // lain yang masih aktif -> tolak (F14/Bab 12.3).
    const { data: conflict } = await supabase
      .from("submission")
      .select("submission_id")
      .eq("customer_phone", nextPhone)
      .eq("assessment_type", row.assessment_type)
      .is("deleted_at", null)
      .neq("submission_id", id)
      .limit(1);
    if (conflict && conflict.length > 0) {
      return errorResponse(
        409,
        "PHONE_CONFLICT",
        "Nomor HP ini sudah dipakai submission lain untuk jenis assessment yang sama.",
      );
    }
  }

  // ---- Jawaban: validasi + hitung ulang di server ----
  let answersChanged = false;
  let picked: PickedAnswers | null = null;
  let updateFields: Record<string, unknown> = {};

  if (Array.isArray(answers)) {
    const { data: questionRows, error: qError } = await supabase
      .from("question_bank")
      .select("question_id, order_index")
      .eq("assessment_type", row.assessment_type)
      .order("order_index");
    if (qError || !questionRows) {
      console.error("[submissions:id] gagal memuat pertanyaan:", qError);
      return errorResponse(500, "INTERNAL", "Gagal memuat pertanyaan. Coba lagi ya.");
    }
    const questionIds = questionRows.map((q) => q.question_id);

    const { data: optionRows, error: oError } = await supabase
      .from("question_option")
      .select(
        "option_id, question_id, option_text, score_rating, score_ksm, score_kpr, score_kkb",
      )
      .in("question_id", questionIds);
    if (oError || !optionRows) {
      console.error("[submissions:id] gagal memuat opsi:", oError);
      return errorResponse(500, "INTERNAL", "Gagal memuat pilihan jawaban. Coba lagi ya.");
    }

    const validation =
      row.assessment_type === "RATING"
        ? validatePickedAnswers(questionIds, buildRatingOptionMap(optionRows), answers)
        : validatePickedAnswers(questionIds, buildNeedsOptionMap(optionRows), answers);

    if (!validation.ok) {
      return errorResponse(400, validation.code, validation.message);
    }
    picked = validation.picked;
    const nextPicked = picked;

    // Bandingkan dengan jawaban tersimpan — jangan "ubah" kalau tidak berubah.
    const { data: currentAnswers } = await supabase
      .from("submission_answer")
      .select("question_id, option_id")
      .eq("submission_id", id);
    const current = new Map(
      (currentAnswers ?? []).map((a) => [a.question_id, a.option_id] as const),
    );
    answersChanged = questionIds.some(
      (qid) => current.get(qid) !== nextPicked[qid],
    );

    if (row.assessment_type === "RATING") {
      const recalc = recalculateRating(
        nextPicked,
        buildRatingOptionMap(optionRows),
      );
      updateFields = {
        final_score: recalc.finalScore,
        persona: recalc.persona,
        readiness: recalc.readiness,
        ksm_gate: recalc.ksmGate,
        primary_recommendation: recalc.primaryRecommendation,
        secondary_recommendation: recalc.secondaryRecommendation,
        recommendation_confidence: recalc.recommendationConfidence,
        financial_goal: recalc.financialGoal,
        financial_need: recalc.financialNeed,
        _dims: recalc.dimensions,
      };
    } else {
      const recalc = recalculateNeeds(nextPicked, buildNeedsOptionMap(optionRows));
      updateFields = {
        ksm_score: recalc.ksmScore,
        kpr_score: recalc.kprScore,
        kkb_score: recalc.kkbScore,
        primary_recommendation: recalc.primaryRecommendation,
        secondary_recommendation: recalc.secondaryRecommendation,
        // Enum DB (Bab 12.3) — "RECOMMENDATION" disimpan sebagai "MODERATE".
        recommendation_confidence: needsConfidenceForDb(
          recalc.recommendationConfidence,
        ),
      };
    }
  }

  const identityChanged =
    nextName !== row.customer_name || nextPhone !== row.customer_phone;
  if (!identityChanged && !answersChanged) {
    return errorResponse(
      400,
      "NOTHING_TO_UPDATE",
      "Tidak ada perubahan untuk disimpan.",
    );
  }

  // ---- Snapshot lama (untuk audit, Bab 25) ----
  const { data: oldAnswerRows } = await supabase
    .from("submission_answer")
    .select("question_id, option_id")
    .eq("submission_id", id);
  const oldAnswers: PickedAnswers = {};
  for (const a of oldAnswerRows ?? []) oldAnswers[a.question_id] = a.option_id;

  const oldSnapshot = snapshotOf(row);
  const newSnapshot: SubmissionSnapshot = {
    ...oldSnapshot,
    customerName: nextName,
    customerPhone: nextPhone,
  };

  // Field hasil terhitung yang ikut berubah (audit Bab 25) — nilainya sudah
  // dihitung ulang di atas (updateFields).
  if (answersChanged && updateFields.final_score !== undefined) {
    newSnapshot.finalScore = updateFields.final_score as number;
    newSnapshot.persona = updateFields.persona as string;
    newSnapshot.readiness = updateFields.readiness as string;
    newSnapshot.ksmGate = updateFields.ksm_gate as boolean;
    newSnapshot.primaryRecommendation = updateFields.primary_recommendation as string;
    newSnapshot.secondaryRecommendation =
      (updateFields.secondary_recommendation as string | null) ?? null;
    newSnapshot.recommendationConfidence =
      updateFields.recommendation_confidence as string;
    newSnapshot.financialGoal = (updateFields.financial_goal as string | null) ?? null;
    newSnapshot.financialNeed = (updateFields.financial_need as string | null) ?? null;
  }
  if (answersChanged && updateFields.ksm_score !== undefined) {
    newSnapshot.ksmScore = updateFields.ksm_score as number;
    newSnapshot.kprScore = updateFields.kpr_score as number;
    newSnapshot.kkbScore = updateFields.kkb_score as number;
    newSnapshot.primaryRecommendation = updateFields.primary_recommendation as string;
    newSnapshot.secondaryRecommendation =
      (updateFields.secondary_recommendation as string | null) ?? null;
    newSnapshot.recommendationConfidence =
      updateFields.recommendation_confidence as string;
  }

  const auditChange = buildAuditChange(
    oldSnapshot,
    newSnapshot,
    answersChanged ? oldAnswers : null,
    answersChanged && picked ? picked : null,
  );

  // ---- Simpan perubahan ----
  const now = new Date().toISOString();
  // `_dims` adalah data transient (snapshot dimension_result), bukan kolom DB.
  const dims = (updateFields as { _dims?: unknown[] })._dims;
  const dbFields: Record<string, unknown> = { ...updateFields };
  delete dbFields._dims;

  const { error: updateError } = await supabase
    .from("submission")
    .update({
      customer_name: nextName,
      customer_phone: nextPhone,
      ...dbFields,
      updated_at: now,
      updated_by: admin.userId,
    })
    .eq("submission_id", id);
  if (updateError) {
    console.error("[submissions:id] update gagal:", updateError);
    return errorResponse(
      500,
      "INTERNAL",
      "Perubahan gagal disimpan. Silakan coba lagi.",
    );
  }

  // Ganti jawaban mentah (hanya bila ada yang berubah).
  if (answersChanged && picked) {
    const { error: delError } = await supabase
      .from("submission_answer")
      .delete()
      .eq("submission_id", id);
    if (delError) {
      console.error("[submissions:id] hapus jawaban lama gagal:", delError);
      return errorResponse(
        500,
        "INTERNAL",
        "Perubahan gagal disimpan sepenuhnya. Silakan coba lagi.",
      );
    }
    const { error: insError } = await supabase
      .from("submission_answer")
      .insert(
        Object.entries(picked).map(([questionId, optionId]) => ({
          submission_id: id,
          question_id: questionId,
          option_id: optionId,
        })),
      );
    if (insError) {
      console.error("[submissions:id] simpan jawaban baru gagal:", insError);
      return errorResponse(
        500,
        "INTERNAL",
        "Perubahan gagal disimpan sepenuhnya. Silakan coba lagi.",
      );
    }

    // RATING: snapshot dimension_result ikut diperbarui (audit Bab 12.5).
    if (row.assessment_type === "RATING" && Array.isArray(dims)) {
      await supabase.from("dimension_result").delete().eq("submission_id", id);
      const { error: dimError } = await supabase
        .from("dimension_result")
        .insert(
          (dims as Array<{
            dimension: string;
            rawScore: number;
            contribution: number;
            status: string;
          }>).map((d) => ({
            submission_id: id,
            dimension: d.dimension,
            raw_score: d.rawScore,
            contribution: d.contribution,
            status: d.status,
          })),
        );
      if (dimError) {
        // Snapshot dimensi gagal — data utama + jawaban sudah tersimpan
        // (recomputable). Log saja, konsisten dengan perilaku submit.
        console.error("[submissions:id] simpan dimension_result gagal:", dimError);
      }
    }
  }

  // ---- Audit log (Bab 25 — WAJIB untuk edit) ----
  if (auditChange.changed) {
    const { error: auditError } = await supabase.from("submission_audit_log").insert({
      submission_id: id,
      admin_id: admin.userId,
      action: "UPDATE",
      // Isi audit hanya berisi string/number/boolean/object/array sederhana.
      old_value: auditChange.oldValue as Json | null,
      new_value: auditChange.newValue as Json | null,
    });
    if (auditError) {
      // Perubahan sudah tersimpan tapi audit gagal -> log keras + 500 agar
      // admin tahu ada perubahan tanpa jejak (skala demo: jarang terjadi).
      console.error("[submissions:id] audit log gagal:", auditError);
      return errorResponse(
        500,
        "AUDIT_FAILED",
        "Perubahan tersimpan, tapi gagal mencatat log audit. Hubungi tim developer.",
      );
    }
  }

  // Kembalikan detail terbaru agar client bisa memperbarui tampilan in-place.
  const detail = await buildDetailPayload(supabase, id);
  if (detail.error || !detail.row) {
    return errorResponse(500, "INTERNAL", "Gagal memuat data terbaru.");
  }
  return NextResponse.json({ ...detail.payload, changed: true });
}

// ---------------------------------------------------------------------------
// DELETE — soft-delete (Bab F10/12.3) + audit log WAJIB (Bab 25).
// ---------------------------------------------------------------------------
export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return errorResponse(401, "UNAUTHORIZED", "Masuk sebagai admin dulu ya.");
  }

  const { id } = await context.params;
  if (!UUID_PATTERN.test(id)) {
    return errorResponse(404, "NOT_FOUND", "Data tidak ditemukan.");
  }

  const supabase = createAdminClient();

  const { data: row, error: rowError } = await supabase
    .from("submission")
    .select("*")
    .eq("submission_id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (rowError || !row) {
    if (rowError) console.error("[submissions:id] gagal memuat row:", rowError);
    return errorResponse(404, "NOT_FOUND", "Data tidak ditemukan.");
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("submission")
    .update({ deleted_at: now, updated_at: now, updated_by: admin.userId })
    .eq("submission_id", id);
  if (updateError) {
    console.error("[submissions:id] soft-delete gagal:", updateError);
    return errorResponse(
      500,
      "INTERNAL",
      "Data gagal dihapus. Silakan coba lagi.",
    );
  }

  // Audit log DELETE: simpan snapshot data sebelum dihapus (Bab 25).
  const { error: auditError } = await supabase
    .from("submission_audit_log")
    .insert({
      submission_id: id,
      admin_id: admin.userId,
      action: "DELETE",
      old_value: buildDeleteSnapshot(snapshotOf(row)) as unknown as Json,
      new_value: null,
    });
  if (auditError) {
    console.error("[submissions:id] audit log DELETE gagal:", auditError);
    return errorResponse(
      500,
      "AUDIT_FAILED",
      "Data terhapus, tapi gagal mencatat log audit. Hubungi tim developer.",
    );
  }

  return NextResponse.json({ ok: true });
}
