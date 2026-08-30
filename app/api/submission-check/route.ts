import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeIndonesianPhone } from "@/lib/utils/phone";

// Cek existing submission berdasarkan (customer_phone, assessment_type) — PRD F14.
// Endpoint publik (nasabah belum login), tapi query lewat service-role client di
// server karena RLS melarang read publik ke tabel submission (PRD Bab 23).
// Hanya mengembalikan submission_id milik sendiri — tanpa data sensitif lainnya.

const ASSESSMENT_TYPES = ["RATING", "NEEDS"] as const;
type AssessmentType = (typeof ASSESSMENT_TYPES)[number];

function isAssessmentType(value: unknown): value is AssessmentType {
  return (
    typeof value === "string" &&
    (ASSESSMENT_TYPES as readonly string[]).includes(value)
  );
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, "INVALID_JSON", "Body request tidak valid.");
  }

  const { phone, assessmentType } = (body ?? {}) as {
    phone?: unknown;
    assessmentType?: unknown;
  };

  if (!isAssessmentType(assessmentType)) {
    return errorResponse(
      400,
      "INVALID_INPUT",
      "Jenis assessment tidak dikenal.",
    );
  }

  // Jangan percaya input client — validasi ulang di server (PRD Bab 23).
  const normalized =
    typeof phone === "string" ? normalizeIndonesianPhone(phone) : null;
  if (!normalized) {
    return errorResponse(
      400,
      "INVALID_PHONE",
      "Nomor HP tidak valid. Gunakan format Indonesia (08xx atau +62).",
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("submission")
    .select("submission_id")
    .eq("customer_phone", normalized)
    .eq("assessment_type", assessmentType)
    .is("deleted_at", null)
    // F14: jika lebih dari 1 (race condition) ambil yang terbaru.
    .order("submitted_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (error) {
    console.error("[submission-check] query gagal:", error.message);
    return errorResponse(
      500,
      "INTERNAL",
      "Terjadi gangguan saat memeriksa data. Coba lagi ya.",
    );
  }

  if (data && data.length > 0) {
    return NextResponse.json({
      found: true,
      submissionId: data[0].submission_id,
    });
  }

  return NextResponse.json({ found: false });
}
