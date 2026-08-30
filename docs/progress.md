# Progress Log — Financial Health & Credit Needs Assessment

Status keseluruhan: 🔴 Belum mulai / 🟡 Sedang berjalan / 🟢 Selesai

## Ringkasan Modul
| Modul | Status | Terakhir Update |
|---|---|---|
| Project & Supabase Setup | 🟢 | 2026-08-30 |
| Landing Page | 🟢 | 2026-08-30 |
| Identity Capture & Pembatasan 1x | 🟢 | 2026-08-30 |
| Financial Rating Quiz + Scoring + KSM Gate | 🟢 | 2026-08-30 |
| Financial Rating Result Page | 🔴 | - |
| Financial Needs Quiz + Scoring + Tie-Breaker | 🔴 | - |
| Financial Needs Result Page | 🔴 | - |
| CTA WhatsApp Round-Robin | 🔴 | - |
| Admin Login | 🔴 | - |
| Admin Dashboard | 🔴 | - |
| Admin Detail (Edit/Delete + Audit Log) | 🔴 | - |
| Responsive & Accessibility | 🔴 | - |
| QA — Acceptance Criteria AC1-AC12 | 🔴 | - |

## Log Detail
### [2026-08-30]
- Modul 1 selesai: setup deps (@supabase/supabase-js, @supabase/ssr, lucide-react, tsx), struktur lib/ (supabase client browser/server/admin, scoring engine rating + recommendation), env config.
- Modul 6/7 (scoring engine) ikut diimplementasikan: rating.ts + recommendation.ts + 10 unit test lolos (AC1-AC5 + Path B/C/E).
- Status: selesai (Modul 1), scoring engine siap (Modul 6/7)
- Referensi PRD: Bab 5.1, 8.1, 8.2, 8.3, 14, 22, 23, 26
- Commit: <hash>

### [2026-08-30] Modul 2 (Supabase Setup) — SELESAI
- 9 tabel dibuat via migration: question_bank, question_option, submission (+ index unique (customer_phone, assessment_type)), submission_answer, dimension_result, admin_profile, cs_contact, cs_rotation_state, submission_audit_log.
- Seed data lengkap (source of truth Bab 31): 24 pertanyaan (RATING Q1-Q14, NEEDS Q1-Q10) + 115 opsi, tervalidasi 1:1 dengan dokumen "Kredit Web.md".
- Seed placeholder 3 nomor CS + function `get_next_cs()` (round-robin increment + pick).
- RLS aktif di semua 9 tabel: question_bank/option = read publik; submission/submission_answer = insert publik, read authenticated; dimension_result = read authenticated; cs_contact = read publik; sisanya authenticated. Diverifikasi via curl (anon tidak bisa baca submission).
- Admin auth user dibuat: `admin@demo.com` (BRANCH_ADMIN) + admin_profile row. Login terverifikasi via `/auth/v1/token`.
- TypeScript types diregenerasi (`__InternalSupabase` + Tables/TablesInsert/TablesUpdate helper).
- ⚠️ Security fix: `SUPABASE_SERVICE_ROLE_KEY` asli ter-commit di `.env.example` pada commit 3c96f49 → dihapus dari file, diganti placeholder. **Key tetap terekspos di riwayat git → wajib rotate di Supabase Dashboard.**
- Referensi PRD: Bab 5.1, 5.2, 12.1-12.8, 22, 23, 25, 31
- Commit: d858cee

### [2026-08-30] Modul 3 (Landing Page) — SELESAI
- Halaman landing `/` (static, prerendered): header wordmark "Livin'" + badge Demo, hero (eyebrow + heading serif + copy hangat + trust signals), 2 kartu assessment setara (Financial Health Score → `/financial-health/quiz`, Kebutuhan Kredit → `/financial-needs/quiz`), footer dark + disclaimer demo.
- Design system (Bab 20): palet netral warm paper + aksen teal dalam (2 warna saja), wordmark teks, Fraunces (serif display) + Geist (body), radius konsisten, shadow minimal, Lucide Icons (Gauge/Compass/Clock/FileQuestion/ShieldCheck/ArrowRight), tanpa emoji.
- Animasi (CSS murni, hormat `prefers-reduced-motion`): line-mask reveal heading (3 baris staggered), rise-in staggered per section (header → hero → trust → kartu → footer), glow teal ambient drift, hover kartu (lift + icon tilt + arrow slide + underline expand).
- Sesuai F1/16.1: 2 kartu setara (tidak ada yang didahulukan), mobile = stack vertikal / desktop = berdampingan max-width + stagger offset, kartu = icon + judul + deskripsi 1 kalimat + CTA, tap target besar (seluruh kartu clickable). A11y: kontras WCAG AA, body ≥16px (Bab 21), focus-visible outline.
- Verifikasi: typecheck ✓, lint ✓ (0 error), build ✓ (static), screenshot desktop (1440px) + mobile (390px) diverifikasi visual.
- Referensi PRD: Bab F1, 16.1, 15, 19, 20, 21, 24
- Commit: 6a76c99

### [2026-08-30] Modul 4 (Identity Capture + Pembatasan 1x Isi) — SELESAI
- `lib/utils/phone.ts` (F13): normalisasi + validasi nomor HP Indonesia — `08xx` / `+62 8xx` / `628xx` (spasi, strip, tanda kurung, titik diabaikan) → bentuk kanonik `62xxxxxxxxxx` sebagai identifier unik F14. 7 unit test (format valid, batas panjang, prefix salah, konsisten antar-format).
- `POST /api/submission-check` (F14, Bab 22/23): cek `(customer_phone, assessment_type)` via **service-role client di server** (RLS melarang read publik ke `submission`), hanya mengembalikan `submission_id` sendiri — tanpa data sensitif. Exclude soft-deleted (`deleted_at IS NULL`), ambil `submitted_at` terbaru jika >1 (race condition). Validasi ulang di server (nomor dinormalisasi ulang, type whitelist RATING/NEEDS).
- Form identitas (F13, AC11): nama + no HP **di awal quiz**, validasi ramah dengan contoh format, animasi shake saat invalid (icon + teks, bukan cuma warna — Bab 21), state loading "Memeriksa data…", state error gangguan + tombol retry.
- F14 (AC12): nomor sudah pernah submit **jenis yang sama** → state "Kamu sudah pernah mengisi ini" + tombol "Lihat hasil kamu" + auto-redirect 2.5 dtk ke `/…/result?id=<submission_id lama>` (skip quiz sepenuhnya). Per jenis assessment: 1 nomor boleh RATING 1x + NEEDS 1x.
- `quiz-flow.tsx` (reusable RATING & NEEDS): phase identitas → quiz (area quiz = placeholder, engine pertanyaan milik Modul 5/9), step progress 2 langkah (bar terisi animasi progress-fill). Identitas persist **sessionStorage via `useSyncExternalStore`** — aman SSR (server snapshot null), refresh tidak mengulang identitas, fallback in-memory saat sessionStorage terblokir (private mode).
- `globals.css`: token warna error (`error` `#b3402a`, `error-deep`, `error-tint`, `error-line`) + keyframes `shake` & `progress-fill` (hormat `prefers-reduced-motion`).
- Fix lint error React-compiler rule `set-state-in-effect`: refactor `useEffect+setState` mount-read jadi `useSyncExternalStore` (pola idiomatic React 19, sekaligus menghapus skeleton buatan & render-pass ekstra). Bonus: import unused di `rating.test.ts` dibersihkan.
- Verifikasi: 17 unit test ✓ (10 scoring + 7 phone), typecheck ✓, lint ✓ (0 error, 1 warning di generated file `database.types.ts`), build ✓ (quiz pages static, API dynamic).
- Uji API live: phone baru → `found:false`; format `08xx` & `628xx` dinormalisasi ke identifier sama; 400 `INVALID_PHONE` / `INVALID_INPUT` / `INVALID_JSON` sesuai kontrak Bab 22; phone seeded → `found:true` + `submissionId` benar; NEEDS dgn nomor yg sudah punya RATING → `found:false` (per jenis ✓).
- Uji alur browser (dev server): (1) AC11 — form identitas tampil duluan, submit kosong → error nama+no HP, no HP salah format → error contoh, sukses → quiz-ready "Halo, {nama}!"; (2) refresh → tetap quiz-ready (identitas tidak diulang), tanpa hydration error; (3) tombol "Ubah" → balik ke form identitas; (4) F14 — phone seeded → "Kamu sudah pernah mengisi ini" → auto-redirect ke `/financial-health/result?id=<id lama>` (target 404 karena halaman hasil masih Modul 8/11 — sesuai dependency graph); (5) NEEDS dgn nomor sama → lanjut quiz (bukan redirect) ✓. Data seed test dihapus setelah uji.
- ⚠️ Temuan: 1 baris test "Tes Modul 4" (6281200001111, RATING) dari sesi sebelumnya masih ada di tabel `submission` — keputusan user: hapus atau pertahankan sebagai sample data admin.
- Referensi PRD: Bab F13, F14, 11, 16.2, 22, 23, 26 (AC11, AC12)
- Commit: a83740b

### [2026-08-30] Modul 5 (Financial Rating Quiz Engine) — SELESAI
- `app/quiz/quiz-engine.tsx` (F2, reusable untuk NEEDS di Modul 9): 1 pertanyaan per layar (Bab 16.2), progress bar atas (`role=progressbar` + "Soal X dari 14"), eyebrow dimensi per soal (Cash Flow, dst.; Q13 "Tujuan Finansial", Q14 "Kebutuhan Finansial"), option card gaya radio dengan letter badge A–E + check, **keterangan tambahan** opsi muncul inline saat dipilih (Bab 17, animasi `detail-in`), tombol "Lanjut" eksplisit & disabled sampai memilih (Bab 17 — bukan auto-advance), tombol "Kembali" (jawaban lama tetap tersimpan, bisa diubah), transisi antar-soal slide maju/mundur beda arah (`quiz-in`/`quiz-in-back`, hormat `prefers-reduced-motion`), skor opsi tidak pernah tampil (F2).
- Persist jawaban + posisi soal di **sessionStorage** per jenis assessment (Bab 11): refresh di tengah kuis kembali ke soal yang sama dengan jawaban utuh — diverifikasi di browser.
- UX loading/error (Bab 16.2, 11): skeleton saat pertanyaan dimuat; error load = kartu "Sepertinya ada gangguan" + tombol "Muat ulang"; error submit = banner ramah + retry, jawaban tidak hilang; double-click submit dicegah (tombol disabled + state "Menyiapkan hasil…").
- A11y (Bab 21): radio asli (`<input type=radio>` + `fieldset`/`legend` sr-only) → navigasi keyboard native, tap target ≥44px, body ≥16px, error pakai icon+teks.
- Mobile (Bab 19): full-screen per soal, **tombol sticky di bawah layar** (bar fixed + safe-area inset), desktop tombol inline.
- `GET /api/questions?type=` (Bab 22, publik): 14 RATING / 10 NEEDS, **skor tidak dikirim ke client** (F2 + anti-manipulasi Bab 23), 400 untuk type tidak dikenal. Pakai anon key (data memang read-only publik sesuai RLS).
- `POST /api/submissions` (Bab 22, AC10, Bab 23) — ditambahkan di modul ini agar kuis RATING bisa selesai end-to-end (engine scoring sudah ada sejak Modul 1): validasi lengkap di server (nama, no HP, semua 14 `question_id`+`option_id` valid & tidak duplikat; jawaban kurang → 400 `INCOMPLETE_ANSWERS` + daftar soal terlewat → client arahkan ke soal tersebut = AC10), **skor dihitung ulang dari DB** berdasarkan `option_id` (nilai client tidak dipercaya), insert `submission` + `submission_answer` + `dimension_result` via service role (Bab 22, snapshot audit Bab 12.5/F4), **idempoten** (nomor yang sudah submit dikembalikan submission lamanya; unique-violation race → 23505 ditangani), rate limit 10x/jam per nomor HP (Bab 23, in-memory skala demo). NEEDS → 501 (engine scoring-nya Modul 10).
- Q13/Q14 (F3): `is_scoring=false` dari DB, non-scoring — disimpan sebagai `financial_goal`/`financial_need` (teks opsi; PRD "enum A–H" vs contoh AC5 "Punya rumah" → dipilih teks untuk keperluan copy personalisasi).
- Assumption (dicatat, belum didefinisi PRD): `recommendation_confidence` untuk RATING = `STRONG` jika KSM Gate PASS, `MODERATE` jika FAIL.
- Alur akhir: submit sukses → state "Selesai, {nama}!" + CTA "Lihat hasil kamu" → `/financial-health/result?id=<id>` (halaman itu sendiri masih 404 — Modul 8). Flag `fw-submitted-<type>` di sessionStorage: refresh/open ulang halaman kuis setelah submit → langsung state selesai (kuis tidak bisa diulang, konsisten F14).
- `quiz-flow.tsx`: RATING kini merender engine sungguhan; NEEDS masih placeholder (disambungkan Modul 9).
- Verifikasi: 17 unit test ✓, typecheck ✓, lint ✓ (0 error, 1 warning generated file), build ✓. API live: submit lengkap → 201 + finalScore 82 = persis kalkulasi independen (CF 100, Debt 77.5, EF 67.5, Saving 72.5, Invest 90, Protection 82.5 → KSM Gate PASS, persona THE_BUILDER, readiness HIGH, confidence STRONG, goal/need tersimpan benar); AC10 → 400 + missing 11 id benar; opsi invalid → 400; NEEDS → 501; idempoten → id sama + `alreadyExists`; rate limit → 429 setelah 10 percobaan/jam. Browser desktop: identitas → Q1 (detail opsi B muncul, Lanjut aktif), Lanjut→Q2, Kembali→Q1 (jawaban B utuh), refresh di Q2 (restore soal+jawaban), 14 soal selesai → submit → "Selesai, Budi!" → CTA ke result?id= benar (404 = Modul 8), refresh → tetap state selesai. Browser mobile 390px: layout full-screen, sticky bar Lanjut di bawah, tap target besar. Data test semua di-cleanup dari DB.
- Referensi PRD: Bab F2, F3, F4, F5, 11, 16.2, 17, 19, 20, 21, 22, 23, 26 (AC10)
- Commit: bf1357b