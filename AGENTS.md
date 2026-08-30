# AGENT.md — Financial Health & Credit Needs Assessment Web App

## 1. Ringkasan Project
Web app demo/business case (bukan sistem resmi bank) dengan 2 alur assessment:
1. Financial Rating Assessment (12 pertanyaan, 6 dimensi, skor 0-100, persona, KSM Gate)
2. Financial Needs Assessment (10 pertanyaan, skor akumulatif KSM/KPR/KKB, tie-breaker)

Hasil masuk ke dashboard admin/cabang untuk follow-up. Timeline ±1 minggu, skala kecil (bukan production banking system).

**Source of truth mutlak:** `/docs/PRD.md` (v1.3 Final). Kalau ada bagian dokumen ini (AGENTS.md) yang terasa bentrok dengan PRD, PRD yang menang — laporkan bentrokan itu, jangan diam-diam pilih salah satu.

## 2. Tech Stack (WAJIB, jangan diganti tanpa approval eksplisit)
| Layer | Teknologi |
|---|---|
| Frontend + server logic | Next.js (App Router) |
| Database + Auth | Supabase (Postgres, Supabase Auth, Row Level Security) |
| Hosting | Vercel |
| Styling / Icon | Tailwind CSS + Lucide Icons |
| Dev tooling (bukan runtime) | Supabase MCP — dipakai untuk provisioning schema, migration, generate TS types, cek log selama development saja |

## 3. Aturan Emas
1. PRD = source of truth. Formula skor, KSM Gate, tie-breaker, dan seluruh Bab 8 & 31 wajib diimplementasikan persis, bukan interpretasi ulang.
2. Commit di setiap perubahan sekecil apapun. Tidak ada "commit besar di akhir hari".
3. Setiap commit ke repo utama wajib disertai sinkronisasi ke repo memory (Graphify) — lihat workflow di prompt setup / README.
4. Update `/docs/progress.md` setiap task/subtask selesai.
5. Requirement ambigu → tanya dulu, jangan asumsi (kecuali sudah ditandai "Assumption" eksplisit di PRD).
6. Fitur dianggap selesai hanya jika Acceptance Criteria terkait (PRD Bab 26) sudah lolos.
7. Nasabah tidak perlu login. Admin wajib login (Supabase Auth), 1 akun cukup untuk versi demo ini.
8. Data submission nasabah sensitif (nama, no HP) — akses read hanya untuk admin ter-autentikasi, ditegakkan lewat Supabase RLS, bukan cuma di level UI.

## 4. Business Rules Kunci (ringkasan — detail & tabel lengkap tetap wajib cek PRD Bab 8 & 31)
**Financial Rating:**
- 6 dimensi berbobot: Cash Flow 25%, Debt Management 20%, Emergency Fund 20%, Saving Habit 15%, Investment Habit 10%, Financial Protection 10%.
- Dimension Raw Score = rata-rata 2 soal per dimensi. Contribution = Raw Score × Bobot. Final Score = ROUND(jumlah seluruh contribution), clamp 0-100.
- Persona (dari Final Score): 85-100 THE ARCHITECT, 70-84 THE BUILDER, 55-69 THE EXPLORER, 40-54 THE ADVENTURER, 0-39 THE STARTER.
- Readiness (dari Final Score, dipakai decision engine, beda dari Persona): 70-100 HIGH, 55-69 MEDIUM, 0-54 LOW.
- KSM Gate PASS hanya jika SEMUA: Final Score ≥70 AND Cash Flow ≥60 AND Debt Management ≥60 AND Emergency Fund ≥40. Kalau salah satu gagal → KSM Gate FAIL walau Final Score tinggi.
- Q13 (Goal) & Q14 (Need) tidak pernah memengaruhi skor/readiness — hanya untuk personalisasi copy.
- Recommendation path setelah KSM Gate: A) PASS→KSM, B) Emergency Fund<60 atau Saving<60→CASA/Saving, C) Cash Flow<60→Livin', D) Debt Management<60→Debt Advice, E) ≥2 dimensi <40→Financial Advice + edukasi (jangan push produk spesifik). Priority order kalau banyak masalah: Debt Management → Cash Flow → Emergency Fund → Saving → Financial Protection → Investment.

**Financial Needs:**
- Skor = raw sum (tanpa bobot tambahan) dari 10 pertanyaan, tiap opsi nambah poin ke KSM/KPR/KKB sekaligus.
- Selisih skor tertinggi ≥5 → Strong Recommendation (1 produk). 3-4 → Recommendation (1 produk). 1-2 → Dual Recommendation (2 produk).
- Skor sama persis (tie) → Tie-Breaker berurutan: Actual Need (Q7) → Urgency (Q9) → Existing Asset Gap → Life Stage (Q1, supporting factor terakhir saja, bukan aturan umum).
- Kalau tetap tidak bisa dibedakan atau ketiga skor berdekatan → "No Strong Recommendation", tampilkan multi-produk.

**Pembatasan pengisian (F14):** identifier = nomor HP, berlaku per jenis assessment (boleh isi Financial Health 1x + Financial Needs 1x). Kalau nomor HP sudah pernah submit jenis assessment yang sama → langsung redirect ke halaman hasil lama (skip quiz), bukan pesan penolakan.

**CTA hasil (F6/F9):** klik tombol rekomendasi → buka WhatsApp CS, nomor dipilih round-robin dari 3 nomor di tabel `cs_contact` (bukan mapping per produk). Nomor CS masih placeholder sampai ada data asli dari client.

**Admin (F10):** boleh edit & hapus submission, tapi wajib soft-delete (`deleted_at`, bukan hapus permanen) + audit log wajib di setiap edit/delete (`submission_audit_log`: siapa, data sebelum/sesudah, kapan).

## 5. Struktur Folder (acuan)
```
app/
├── page.tsx                          # Landing (F1)
├── financial-health/
│   ├── quiz/page.tsx                 # Identity + Q1-Q14 (F13, F2, F3)
│   └── result/page.tsx               # Result (F6)
├── financial-needs/
│   ├── quiz/page.tsx                 # Identity + Q1-Q10 (F13, F7)
│   └── result/page.tsx               # Result (F9)
├── admin/
│   ├── login/page.tsx                # Login (F11)
│   ├── dashboard/page.tsx            # List (F10)
│   └── submission/[id]/page.tsx      # Detail + edit/delete (F10)
└── api/
    ├── questions/route.ts            # GET pertanyaan (Bab 22)
    ├── submissions/route.ts          # POST submit / GET list admin (Bab 22)
    └── cs/route.ts                   # round-robin CTA WA (F6/F9)

lib/
├── supabase/                         # client (browser + server)
├── scoring/                          # engine scoring (Bab 8) — murni, testable
└── utils/
```