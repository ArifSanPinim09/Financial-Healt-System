import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

// GET /api/questions?type=RATING|NEEDS — Bab 22 (publik).
// Pertanyaan memang read-only publik sesuai RLS (Bab 23), jadi pakai anon key.
// Kolom skor (score_*) sengaja TIDAK dikirim ke client:
// - F2: "Pilihan tidak perlu menampilkan score ke nasabah"
// - Bab 23: skor dihitung ulang di server dari DB saat submit agar tidak bisa dimanipulasi.

const ASSESSMENT_TYPES = ["RATING", "NEEDS"] as const;

// Hanya kolom yang benar-benar dibutuhkan client (skor tidak ikut!).
type OptionPick = {
  option_id: string;
  question_id: string;
  option_text: string;
  option_detail: string | null;
  order_index: number;
};

function createAnonClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Konfigurasi Supabase belum lengkap.");
  }
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type");
  if (
    !type ||
    !(ASSESSMENT_TYPES as readonly string[]).includes(type)
  ) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Jenis assessment tidak dikenal.",
        },
      },
      { status: 400 },
    );
  }

  try {
    const supabase = createAnonClient();

    const { data: questions, error: qError } = await supabase
      .from("question_bank")
      .select(
        "question_id, dimension, is_scoring, question_text, order_index",
      )
      .eq("assessment_type", type)
      .order("order_index");
    if (qError) throw qError;

    if (!questions || questions.length === 0) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Pertanyaan belum tersedia. Coba lagi nanti ya.",
          },
        },
        { status: 404 },
      );
    }

    const questionIds = questions.map((q) => q.question_id);
    const { data: options, error: oError } = await supabase
      .from("question_option")
      .select(
        "option_id, question_id, option_text, option_detail, order_index",
      )
      .in("question_id", questionIds);
    if (oError) throw oError;

    const optionsByQuestion = new Map<string, OptionPick[]>();
    for (const option of (options ?? []) as OptionPick[]) {
      const list = optionsByQuestion.get(option.question_id);
      if (list) list.push(option);
      else optionsByQuestion.set(option.question_id, [option]);
    }

    const payload = (questions ?? []).map((q) => {
      const questionOptions = (optionsByQuestion.get(q.question_id) ?? [])
        .slice()
        .sort((a, b) => a.order_index - b.order_index);
      return {
        questionId: q.question_id,
        dimension: q.dimension,
        isScoring: q.is_scoring,
        text: q.question_text,
        options: questionOptions.map((o) => ({
          optionId: o.option_id,
          text: o.option_text,
          detail: o.option_detail,
        })),
      };
    });

    return NextResponse.json({ questions: payload });
  } catch (err) {
    console.error("[questions] gagal memuat data:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL",
          message: "Pertanyaan gagal dimuat. Coba lagi ya.",
        },
      },
      { status: 500 },
    );
  }
}
