import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST /api/cs — pilih 1 nomor CS secara round-robin (F6/F9, Bab 12.7).
//
// Logika round-robin diimplementasikan di sini (bukan di function DB) karena
// function `get_next_cs()` yang dibuat di Modul 2 ternyata bermasalah
// ("column reference 'id' is ambiguous" — error 42702). Membaca & menulis
// `cs_contact` + `cs_rotation_state` via service-role lebih terkontrol dan
// mudah diverifikasi.
//
// Mekanisme (PRD Bab 12.7 / F6):
//   index        = last_used_index % jumlah_cs_aktif
//   nomor_dipilih = cs_contact_aktif[index]
//   lalu last_used_index di-increment +1.
//
// Catatan: read-then-write ini punya race kecil (dua klik bersamaan bisa
// membaca index yang sama). Untuk skala demo (puluhan–ratusan submission,
// Bab 24) ini dapat diterima — counter tetap naik monotonic sehingga rotasi
// tetap merata pada dasarnya.
export async function POST() {
  const supabase = createAdminClient();

  const [csRes, stateRes] = await Promise.all([
    supabase
      .from("cs_contact")
      .select("id, wa_number, display_order, prefill_message")
      .eq("is_active", true)
      .order("display_order", { ascending: true }),
    supabase.from("cs_rotation_state").select("id, last_used_index").limit(1),
  ]);

  if (csRes.error || stateRes.error) {
    console.error("[cs] query gagal:", csRes.error?.message ?? stateRes.error?.message);
    return NextResponse.json(
      {
        error: {
          code: "NO_CS",
          message: "CS sedang tidak tersedia. Coba lagi sebentar lagi ya.",
        },
      },
      { status: 503 },
    );
  }

  const contacts = csRes.data ?? [];
  if (contacts.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "NO_CS",
          message: "Nomor CS belum tersedia. Coba lagi sebentar lagi ya.",
        },
      },
      { status: 503 },
    );
  }

  const lastUsed = stateRes.data?.[0]?.last_used_index ?? 0;
  const chosen = contacts[lastUsed % contacts.length];
  const waNumber = String(chosen.wa_number ?? "").replace(/\D/g, "");

  if (!waNumber) {
    console.error("[cs] nomor WA kosong di cs_contact", chosen.id);
    return NextResponse.json(
      {
        error: {
          code: "NO_CS",
          message: "Nomor CS belum tersedia. Coba lagi sebentar lagi ya.",
        },
      },
      { status: 503 },
    );
  }

  // Increment counter (hanya jika baris state ada).
  const stateRow = stateRes.data?.[0];
  if (stateRow) {
    const { error: updErr } = await supabase
      .from("cs_rotation_state")
      .update({ last_used_index: lastUsed + 1, updated_at: new Date().toISOString() })
      .eq("id", stateRow.id);
    if (updErr) {
      // Counter gagal di-increment — tetap kembalikan CS yang dipilih (rotasi
      // tetap berfungsi, hanya counter belum maju). Log untuk developer.
      console.error("[cs] update cs_rotation_state gagal:", updErr.message);
    }
  }

  return NextResponse.json({
    waNumber,
    prefillMessage: chosen.prefill_message ?? "",
  });
}
