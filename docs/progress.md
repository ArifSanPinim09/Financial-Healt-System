# Progress Log — Financial Health & Credit Needs Assessment

Status keseluruhan: 🔴 Belum mulai / 🟡 Sedang berjalan / 🟢 Selesai

## Ringkasan Modul
| Modul | Status | Terakhir Update |
|---|---|---|
| Project & Supabase Setup | 🟢 | 2026-08-30 |
| Landing Page | 🟢 | 2026-08-30 |
| Identity Capture & Pembatasan 1x | 🟢 | 2026-08-30 |
| Financial Rating Quiz + Scoring + KSM Gate | 🟢 | 2026-08-30 |
| Financial Rating Result Page | 🟢 | 2026-08-30 |
| Financial Needs Quiz + Scoring + Tie-Breaker | 🟢 | 2026-08-30 |
| Financial Needs Result Page | 🟢 | 2026-08-30 |
| CTA WhatsApp Round-Robin | 🟢 | 2026-08-30 |
| Admin Login | 🟢 | 2026-08-30 |
| Admin Dashboard | 🟢 | 2026-08-30 |
| Admin Detail (Edit/Delete + Audit Log) | 🟢 | 2026-08-30 |
| Responsive & Accessibility | 🟢 | 2026-08-30 |
| QA — Acceptance Criteria AC1-AC12 | 🔴 | - |

## Log Detail
### [2026-08-30] Modul 16 (Responsive & Accessibility Pass) — SELESAI
- **Audit kontras WCAG AA** (Bab 21) — hitung rasio semua token via script (relative luminance), lalu perbaiki yang gagal 4.5:1 untuk teks normal:
  - Token status dimensi: `--good` `#4a8b3f→#2f6b28` (3.63→**5.65** di atas `good-tint`), `--improve` `#9a6b0e→#7a5206` (4.02→**5.93** di atas `improve-tint`). `strong` (5.52) & `priority` (4.94) sudah lolos.
  - `--error-tint` `#f9ece8→#f7e4de` agar `error` di atasnya 4.94→**4.64** & `error-deep` 6.87→**6.46** (tetap lolos). `--error-line` dikembalikan ke `#eccabf` (ternyata menggelapkan line justru menurunkan kontras text-error-on-line — solusi final: teks tombol outline error diganti `error-deep`).
  - Tombol "Coba lagi" di banner error identity-form: `text-error` di atas `error-tint`+border `error-line` (3.74) → `text-error-deep` di atas `bg-card`+border `error-line` (6.46), icon+judul banner juga `error-deep` (konsisten dgn pola tombol error admin).
  - Caption kecil: semua `text-muted/80` (3.78) → `text-muted/90` (4.61 di atas card) untuk teks 12-13px; `/100` label `muted/70`→`muted/90`; index kartu landing `muted/75`→`muted/90` (axe menilainya walau `aria-hidden`); caption paling bawah NEEDS result di atas `bg-paper` → `text-muted` penuh (5.26). Placeholder `muted/50` dibiarkan (bukan kriteria AA, dan sengaja redup agar tak terlihat seperti nilai terisi).
- **Dialog a11y (WCAG 2.4.3 focus order + focus management)**: helper baru `lib/utils/focus-trap.ts` — `useFocusTrap(ref, active)`: Tab/Shift+Tab terjebak di dalam dialog (wrap first↔last), fokus **restore ke elemen pemicu** saat dialog ditutup. Dipasang di `ConfirmModal` (modal hapus — fokus awal tetap tombol Batal, default aman) & `FilterSheet` (bottom sheet filter mobile). `FilterSheet` juga dapat `aria-labelledby` ke heading (sebelumnya `aria-label` saja) + backdrop `tabIndex={-1}`.
- **A11y misc**:
  - `Toast`: tambah `aria-live="polite" aria-atomic="true"` (muncul dinamis), tombol "Tutup" diperbesar (h-8 min-w-8, target sentuh lebih baik).
  - Badge filter mobile: `aria-label` kini menyebut angka ("Buka filter, N filter aktif") + badge `aria-hidden` (angka dibaca lewat label).
  - Result pages: heading semantics — RATING eyebrow "Hasil kamu · {nama}" jadi `<h1>` (sebelumnya tidak ada h1 sama sekali → axe `page-has-heading-one`); NEEDS tetap `<p>` karena h1 utama = "KSM atau KPR" (hindari 2 h1).
- **Verifikasi otomatis**: 40 unit test ✓, typecheck ✓, lint ✓ (0 error, 1 warning pre-existing di generated file), build ✓ (15 route). **axe-core audit (agent-browser a11y, WCAG 2.0/2.1 AA + best practice)**: landing 0 violation, quiz RATING/NEEDS 0, result RATING 0, result NEEDS 0, dashboard admin 0, login 0 (termasuk state error form), detail submission 0 (view & edit mode), modal hapus & filter sheet 0. **Browser E2E**: keyboard quiz (Tab pilih radio asli → Enter "Lanjut" → "Kembali" pertahankan jawaban); filter sheet mobile 390px (buka → Tab trap di dalam dialog → Escape tutup → fokus balik ke tombol "Buka filter"); modal hapus (fokus awal "Batal" → Tab wrap → Escape → fokus balik ke "Hapus"); login/logout admin; halaman detail & result render benar. Semua kriteria Modul 16 (Bab 19/20/21) terpenuhi — mayoritas sudah ada sejak modul sebelumnya (sticky button mobile, bottom sheet filter, radio asli, label terhubung, error icon+teks, body 16px, tap ≥44px), pass ini memverifikasi & menutup gap.
- Referensi PRD: Bab 19, 20, 21, 24 (a11y & responsive)
- Commit: (menyusul)

### [2026-08-30] Modul 15 (Admin Detail — Edit/Delete + Audit Log) — SELESAI
- `/api/submissions/[id]` (Bab 22, F10 — wajib `requireAdmin()`, selain itu 401):
  - `GET`: detail lengkap 1 submission — data nasabah + hasil ringkas, 14/10 pertanyaan + opsi + jawaban terpilih, `dimension_result` (RATING), riwayat `submission_audit_log` (max 50, nama admin via email). 404 bila tidak ada / sudah dihapus / ID bukan UUID.
  - `PATCH`: admin edit nama/no HP/jawaban. Nama min 2 huruf; no HP dinormalisasi (F14) + **409 `PHONE_CONFLICT`** bila nomor sudah dipakai submission lain jenis sama; jawaban wajib lengkap & valid (AC10, aturan identik submit) → **skor & rekomendasi dihitung ulang di server** dengan engine yang sama persis (deterministik, Bab 24) — RATING: final_score/persona/readiness/ksm_gate/rekomendasi/goal/need + snapshot `dimension_result` ikut diganti; NEEDS: ksm/kpr/kkb_score + rekomendasi. Tanpa perubahan → 400 `NOTHING_TO_UPDATE`. Set `updated_at`/`updated_by` (Bab 12.3).
  - `DELETE`: **soft-delete** (`deleted_at`, bukan hapus permanen — Bab F10/12.3) + `updated_by`. Baris tetap di DB (audit & pemulihan).
  - **Audit log WAJIB (Bab 25)**: UPDATE → diff field lama/baru via `buildAuditChange` (hanya field yang berubah; jawaban = map `old.answers` vs `new.answers`; hasil terhitung yang ikut berubah ikut tercatat); DELETE → `buildDeleteSnapshot` (snapshot 16 field sebelum hapus). Admin = `admin_id` dari session. Audit gagal → 500 `AUDIT_FAILED` (admin tahu ada perubahan tanpa jejak).
- `app/admin/submission/[id]/` (Bab 16.7): `page.tsx` (requireAdmin → redirect login, AC9) + `detail-client.tsx`: kartu DATA NASABAH (nama, no HP, chip jenis, tanggal) + tombol Edit/Hapus, HASIL RINGKAS (RATING: skor+persona+gate+rekomendasi; NEEDS: 3 score bar KSM/KPR/KKB), **Detail jawaban** accordion per soal (opsi terpilih di-highlight), section **Riwayat perubahan** (aksi, email admin, waktu, expand "N field berubah" → sebelum → sesudah per field), **form Edit** (nama, no HP, radio per soal, Batal/Simpan), **modal konfirmasi hapus** (`confirm-modal.tsx` — dialog aksesibel: "Data … akan ditandai terhapus … tidak bisa dibatalkan dari aplikasi"), toast (`toast.tsx`): "Perubahan disimpan" / "Data berhasil dihapus" (auto-hide 3,5 dtk, `role=status`).
- Unit test AC9 (di `lib/admin/access.test.ts`, commit lib/admin): keputusan akses murni — belum login → NOT_AUTHENTICATED, login tapi tanpa `admin_profile` → NOT_ADMIN, valid → OK. Ditambah 5 test audit diff.
- Verifikasi: 40 unit test ✓, typecheck ✓, lint ✓, build ✓. **API E2E 23 kasus ✓**: 401 semua metode tanpa auth; detail RATING (14 soal/6 dimensi) & NEEDS (10 soal); PATCH nama/phone + audit UPDATE (old/new + email admin); `NOTHING_TO_UPDATE`; `INVALID_PHONE`; edit jawaban → skor KSM/KPR/KKB & finalScore ter-rekalkulasi + audit answers & skor before/after + dimension_result diperbarui; restore; DELETE → 200, GET/DELETE ulang → 404, hilang dari list, **verifikasi langsung DB: baris masih ada + `deleted_at` terisi + audit DELETE snapshot + N audit UPDATE**. **Browser E2E ✓**: detail render (data+jawaban+riwayat), edit nama → toast "Perubahan disimpan" + entry audit expandable (sebelum→sesudah), hapus → modal → toast → dashboard (baris hilang), logout → login, AC12 nasabah (no HP lama → skip quiz → halaman hasil lama). Data tes di-cleanup (hanya sisa submission asli).
- Referensi PRD: Bab F10, 12.3, 16.7, 22, 23, 25, 26 (AC9, AC10)
- Commit: (menyusul)

### [2026-08-30] Modul 14 (Admin Dashboard — List & Filter) — SELESAI
- `GET /api/submissions` (Bab 22, admin — wajib session `requireAdmin()`, selain itu 401): list submission untuk dashboard (Bab 16.6, 18).
  - Filter: `type` (RATING/NEEDS), `recommendation` (whitelist 7 nilai), `date_from`/`date_to` (YYYY-MM-DD, diartikan hari WIB UTC+7 — assumption demo), `q` search nama/nomor HP (ilike, karakter khusus PostgREST disanitasi).
  - Sorting: `date_desc` (default) / `date_asc` / `score_desc` / `score_asc`. Skor = `final_score` (RATING) atau skor kategori dari rekomendasi utama (NEEDS) — sort skor diambil semua yang cocok lalu di-sort server (cap 1000, jauh di atas volume demo Bab 24).
  - Pagination: `limit` default 20, maks 25 (Bab 18), `page`; response `{items, total, page, limit, totalPages}`. Input invalid → 400 `INVALID_INPUT`.
  - **Baris soft-deleted (`deleted_at` terisi) tidak pernah muncul** (Bab 18). Data via service role (RLS read submission hanya untuk authenticated — tetap ditegakkan dua lapis).
- `lib/submissions/compute.ts` (murni, testable — dipakai Modul 15 & hasil): `validatePickedAnswers` (aturan AC10 identik submit), `recalculateRating`/`recalculateNeeds` (skor dihitung ulang dari DB dengan engine yang sama persis, deterministik Bab 24), `needsConfidenceForDb/FromDb` (enum DB Bab 12.3 hanya STRONG/MODERATE/DUAL/NONE — "RECOMMENDATION" disimpan "MODERATE", dikembalikan saat dibaca).
- `app/api/result/route.ts` (fix kecil): confidence NEEDS kini dipetakan kembali "MODERATE"→"RECOMMENDATION" agar copy halaman hasil konsisten dengan engine (Bab 8.5).
- `app/admin/dashboard/` (Bab 16.6, 19): `page.tsx` (server component — `requireAdmin()` gagal → **redirect `/admin/login`**, AC9) + `dashboard-client.tsx`: header + topbar, search (debounce), filter jenis/rekomendasi/rentang tanggal/urutan, tabel desktop (NAMA/KONTAK, JENIS, TANGGAL, HASIL RINGKAS — chip persona/skor/rekomendasi) + **card list mobile** (390px), pagination "Menampilkan X–Y dari N", empty state "Belum ada data submission".
- `app/admin/topbar.tsx` + `app/admin/ui/{chips,format}.tsx`: topbar admin (wordmark, email, Keluar + state logging-out) & komponen chip/format tanggal-WIB. `globals.css`: keyframes `sheet-in`/`fade-in` (bottom sheet filter mobile + backdrop, hormat reduced-motion).
- Verifikasi: 40 unit test ✓ (termasuk AC9 + audit), typecheck ✓, lint ✓, build ✓ (15 route). **API E2E 16 kasus list ✓**: struktur/field utuh, filter type/recommendation/rentang tanggal (termasuk kosong→0), search nama & nomor, sort score_desc menurun, limit 25, pagination tanpa overlap, 400 input invalid, 401 tanpa auth. **Browser E2E ✓**: login → dashboard, search menyaring 1 baris, mobile 390px = card list. (Lengkapnya: 51/51 check API E2E lintas Modul 13–15, detail di entry Modul 15.)
- Referensi PRD: Bab F10, 16.6, 18, 19, 22, 23, 26 (AC9)
- Commit: (menyusul)

### [2026-08-30] Modul 13 (Admin Login) — SELESAI
- `app/admin/login/` (F11, Bab 16.5): halaman `/admin/login` — `page.tsx` (server component, panggil `requireAdmin()`: sudah login sebagai admin → langsung redirect ke `/admin/dashboard`, form tidak tampil) + `login-client.tsx` (form email + password, icon field, toggle tampilkan password, state "Memeriksa kredensial…").
- Autentikasi: `signInWithPassword` Supabase Auth **langsung dari browser** (Bab 22 — tanpa endpoint custom; rate-limit login bawaan Supabase). Setelah sukses → `router.replace(next)` + `refresh()`.
- Validasi client (Bab 16.5, 21): email wajib + format, password wajib + min 8 karakter; error per-field dengan icon + teks (bukan cuma warna), animasi shake, `aria-invalid`/`aria-describedby`.
- Error generik: semua kegagalan auth → **"Email atau password salah. Silakan coba lagi."** — tidak dibedakan mana yang salah (security best practice); detail asli hanya di `console.error`.
- `?next=/admin/...` dipertahankan setelah login (edge case session expired, Bab 11) — **hanya path internal `/admin/`** (anti open-redirect); `?expired=true` menampilkan banner "Sesi berakhir…".
- Halaman login sengaja PUBLIK (AC9 melindungi dashboard & detail, bukan halaman login).
- Verifikasi: typecheck ✓, lint ✓, build ✓. Uji browser: tanpa session → `/admin/dashboard` redirect ke login (AC9); submit kosong → 2 error per-field; password salah → pesan generik; login `admin@demo.com` → dashboard. ⚠️ Kredensial demo: password admin di-reset ke `LivinAdmin!23` (demi verifikasi E2E — simpan baik-baik / ganti sebelum produksi).
- Referensi PRD: Bab F11, 16.5, 21, 22, 23, 26 (AC9)
- Commit: (menyusul)

### [2026-08-30] Modul 9 (Needs Quiz) + Modul 10 (KSM/KPR/KKB Scoring & Tie-Breaker) + Modul 11 (Needs Result) — SELESAI
- **Engine scoring NEEDS** (F8, Bab 8.5) di `lib/scoring/needs.ts` — murni & testable:
  - `sumNeedsScores`: raw sum per kategori KSM/KPR/KKB (tanpa bobot — dikonfirmasi client "raw sum aja mas").
  - `buildNeedsRecommendation`: urutan wajib Bab 8.5 — cari skor tertinggi → selisih ≥5 = STRONG (1 produk), 3–4 = RECOMMENDATION (1 produk), 1–2 = DUAL (2 produk teratas), 0 (tie persis) = Tie-Breaker Rule berurutan **Actual Need (Q7) → Urgency (Q9) → Asset Gap (Q3/Q5) → Life Stage (Q1, supporting factor terakhir)**. Jika tetap tak bisa dibedakan ATAU skor berdekatan → "No Strong Recommendation", `isBalanced=true` (copy "kebutuhan berimbang").
  - Tie-breaker berbasis **sinyal jawaban per produk** (bukan urutan array): Q7 keluarga/pendidikan/liburan/usaha→KSM, rumah→KPR, kendaraan→KKB; Q9 makin cepat makin tinggi (KSM); Q3 gap rumah→KPR, Q5 gap kendaraan→KKB; Q1 menikah/anak→KSM. Jawaban "UNANSWERED"/netral dilewati ke breaker berikutnya.
  - Catatan desain: tie yang diputuskan tie-breaker (1 pemenang) tetap `confidence=DUAL` + `secondary` (runner-up) agar UI menampilkan 2 opsi; tie 3 arah tak terpisah → primary + secondary dari 2 produk relevan.
  - ⚠️ Bug nyata yang ditemukan saat test: comparator `scores[b] - scores[a]` di `rankByScore` menghasilkan NaN karena kunci uppercase tidak ada di objek `{ksm,kpr,kkb}` (sort stabil mengembalikan urutan awal [KSM,KPR,KKB] — selalu KSM menang). Diperbaiki jadi `scores[b.toLowerCase()] - scores[a.toLowerCase()]`. Ditangkap unit test AC8 (28/29/27).
- **Unit test** `lib/scoring/needs.test.ts` (Bab 26): AC6 (36/24/12 → STRONG KSM, tanpa secondary) ✓, AC7 (30/30 tie + Q7=Rumah → KPR via actual need) ✓, AC8 (28/29/27 → KPR+KSM, balanced) ✓, boundary selisih 4/5/1-2, tie 3 arah, tie-breaker berurutan (actual need netral → urgency → asset gap), `sumNeedsScores` 10 pertanyaan. Total 31 test pass.
- **Backend `POST /api/submissions`** (F7/F8, Bab 22/23): NEEDS tidak lagi 501. Validasi identik RATING (nama, no HP dinormalisasi, rate limit); **skor dihitung ulang dari DB** (`score_ksm/kpr/kkb` per `option_id` — nilai client tidak dipercaya); insert `submission` (simpan `ksm_score/kpr_score/kkb_score` + `primary_recommendation`/`secondary_recommendation`/`recommendation_confidence`) + `submission_answer`; **idempoten** per `(customer_phone, NEEDS)` (F14) + race 23505; AC10 `INCOMPLETE_ANSWERS` + daftar soal terlewat. Validasi nama/HP dipindah ke atas sebelum cabang jenis assessment (dipakai kedua alur).
- **Backend `GET /api/result`** (F9): kini baca `assessment_type` dari row — NEEDS mengembalikan skor kategori + rekomendasi (tanpa dimensi), RATING tetap seperti semula (regresi aman). Tetap tanpa no HP & jawaban mentah.
- **Frontend quiz** (F7, Bab 16.2): `quiz-flow.tsx` kini merender `QuizEngine` untuk **kedua** jenis (placeholder `QuizReadyState` dihapus); `quiz-engine.tsx` — eyebrow "Kebutuhan Kredit" untuk NEEDS, tombol terakhir "Lihat rekomendasi" (vs "Lihat hasil"), copy selesai beda konteks. Semua perilaku lama (persist sessionStorage, Kembali/Lanjut, sticky mobile, error/retry) otomatis berlaku untuk NEEDS.
- **Result page** `app/financial-needs/result/` (F9, Bab 16.4): `page.tsx` (Suspense + metadata) + `needs-result-client.tsx`. F12 loading bertahap (3 pesan "Menganalisis kebutuhanmu…" → "Mencocokkan dengan produk…" → "Menemukan rekomendasi…", ±3.2 dtk); header rekomendasi ("KSM atau KPR" untuk dual), intro confidence (STRONG/RECOMMENDATION/DUAL + copy berimbang), 3 score bar KSM/KPR/KKB (skala relatif, label teks); **single** → 1 product card (icon + nama + tagline + deskripsi + CTA "Lihat Pilihan X"); **dual** → kartu "Kebutuhanmu terlihat berimbang" + 2 product card (primary highlight "Rekomendasi utama"). CTA → `POST /api/cs` round-robin → `wa.me/{no}?text={pesan}` tab baru (pesan personalisasi nama + produk). Missing/error state konsisten dgn result RATING.
- **Copy produk** (F9): KSM "Kredit Serbaguna Mandiri", KPR "Kredit Pemilikan Rumah", KKB "Kredit Kendaraan Bermotor" — nama per PRD 8.6 (istilah tetap dipakai).
- Verifikasi: 31 unit test ✓, typecheck ✓, lint ✓ (0 error, 1 warning generated file), build ✓. API live (server final): submit NEEDS → 201 + KPR STRONG (13/35/17) & KSM STRONG (22/11/12) dari jawaban berbeda; **DUAL** ditemukan (18/13/17 → KSM+KKB, confidence DUAL) via pencarian acak; idempoten → `alreadyExists` + id sama; `submission-check` F14 → `found:true`; `INCOMPLETE_ANSWERS` & `INVALID_ANSWER` → 400; RATING regresi → 201 + persona benar, `GET /api/result` RATING → 6 dimensi. Halaman `/financial-needs/quiz` & `/financial-needs/result?id=` → 200. Data uji di-cleanup dari DB (hanya sisa 1 submission demo lama).
- ⚠️ Temuan (bukan dari modul ini, sudah ada sebelumnya): function DB `get_next_cs()` masih error 42702 "column reference 'id' is ambiguous" — endpoint `/api/cs` sudah bypass (round-robin di endpoint), function DB tetap dead code utk dibersihkan nanti.
- Referensi PRD: Bab F7, F8, F9, 8.5, 8.6, 11, 16.2, 16.4, 22, 23, 26 (AC6, AC7, AC8)
- Commit: (menyusul)

### [2026-08-30] Modul 8 (Result Page + Loading) & Modul 12 (CTA WA Round-Robin) — SELESAI
- **Halaman hasil Financial Health Score** (F6, Bab 16.3) di `app/financial-health/result/`:
  - `page.tsx` (server) wrap `ResultClient` di `<Suspense>` (wajib utk `useSearchParams`) + metadata.
  - `result-client.tsx`: baca `id` dari URL → fetch `GET /api/result?id=` → tampilkan hasil.
  - **F12 Loading Experience** (Bab F12): 3 pesan bertahap tone "self-discovery" — "Menganalisis kebiasaan finansialmu…" → "Mempelajari pola finansialmu…" → "Menemukan profil finansialmu…" (±3.2 dtk, indikator kompas napas + 3 dot progres). Hasil muncul setelah animasi SELESAI **dan** data terambil.
  - **Skor besar** = cincin SVG terisi (animate 0→skor) + "98/100"; **persona** (pill + deskripsi); **grid 6 dimensi** (2 kolom) dengan warna semantik status (Kuat=hijau tua, Baik=hijau, Perbaiki=amber, Prioritas=merah — Bab 20) + mini bar skor; **section "Your Next Move"** (headline per jalur rekomendasi + body + box personalisasi goal Q13 + CTA).
  - Copy customer-facing bahasa Indonesia (konsisten dgn seluruh app); nama persona tetap Inggris (The Architect dst.); label dimensi tetap dari DB (Cash Flow dst.).
  - Layout responsif (Bab 16.3): desktop = skor+persona kiri, grid dimensi kanan; mobile = stack vertikal.
  - A11y (Bab 21): status tidak hanya warna (ada label teks Kuat/Baik/…), body ≥16px, tap target besar, `aria` pada progress/bar.
  - State: loading (F12) → result; error load → kartu ramah + retry; tanpa `id` → "Belum ada hasil" + CTA mulai assessment.
- **`GET /api/result?id=<submission_id>`** (Bab 22/23, F6): service-role di server (RLS melarang read publik), kunci = `submission_id` (UUID tak terduga, pola capability URL). Kembalikan **hanya field tampilan** (finalScore, persona, readiness, ksm_gate, rekomendasi, goal/need, 6 dimensi) — **tanpa no HP & tanpa jawaban mentah**. 404 utk id tak dikenal/terhapus. Dipakai utk alur submit-baru **dan** F14 (redirect ke hasil lama, sesi baru tanpa data client).
- **`POST /api/cs`** (Modul 12, Bab 12.7/F6): round-robin pilih 1 dari 3 nomor CS. `index = last_used_index % jumlah_cs_aktif`, lalu counter di-increment. Kembalikan `waNumber` (digits) + prefill default. CTA di result page memanggilnya → buka `wa.me/{no}?text={pesan}` di tab baru; pesan personalisasi (nama, skor, persona, rekomendasi).
- ⚠️ **Temuan + deviasi penting:** function DB `get_next_cs()` (dibuat Modul 2) **rusak** — error 42702 "column reference 'id' is ambiguous". Tak ada channel SQL utk fix (Supabase MCP tak tersedia di sesi ini; project ref app tak ada di org CLI). Solusi: round-robin diimplementasikan **langsung di endpoint** via service-role (lebih terkontrol, tak bergantung function DB). Function DB kini dead code — perlu diperbaiki/dihapus nanti. Race kecil read-then-write dapat diterima utk skala demo (counter tetap monotonic).
- Verifikasi: typecheck ✓, lint ✓ (0 error), 17 unit test ✓, build ✓. Uji browser end-to-end: submit RATING (skor 98/THE ARCHITECT/KSM PASS, 6 dimensi STRONG) → F12 loading → result render (cincin, persona, grid warna, Your Next Move); CTA → tab baru WhatsApp `6281234567892` + pesan personalisasi benar (rotasi lanjut dari counter); **F14** re-enter nomor → "sudah pernah mengisi" → auto-redirect ke result lama (render benar, sesi baru); mobile 390px stack rapi (label panjang tak terpotong). Uji `/api/result` (data benar, tanpa phone, 404) & `/api/cs` (rotasi 3 nomor + wrap-around + counter naik). Data test di-cleanup, counter direset.
- Referensi PRD: Bab F6, F12, 12.7, 16.3, 20, 22, 23, 24
- Commit: f044a05

### [2026-08-30] Modul 7 (KSM Gate & Recommendation Engine) — SELESAI
- KSM Gate & Recommendation Engine (F5) lengkap di `lib/scoring/recommendation.ts` (sudah diimplementasikan sejak Modul 1, diverifikasi & ditandai selesai di modul ini).
- `evaluateKsmGate` (Bab 8.2): PASS hanya jika SEMUA — Final Score ≥70 AND Cash Flow ≥60 AND Debt Management ≥60 AND Emergency Fund ≥40. Salah satu gagal → FAIL walau Final Score tinggi.
- `buildRatingRecommendation` (Bab 8.3): Path A (KSM Gate PASS → KSM Opportunity), Path B (EF <60 atau Saving <60 → CASA/Saving, prioritas EF bila keduanya), Path C (Cash Flow <60 → Livin'), Path D (Debt <60 → Debt Management Advice + secondary Livin'), Path E (≥2 dimensi <40 → Financial Advice, jangan push produk spesifik).
- Priority Rule (Bab 8.3): urutan Debt Management → Cash Flow → Emergency Fund → Saving → Financial Protection → Investment untuk dimensi <40 (di-track via `dimensionsBelow40` + `weakestDimension`); KSM Gate selalu dicek terpisah lebih dulu.
- Unit test AC3, AC4, AC5 (Bab 26) di `rating.test.ts`: AC3 — final 78/CF 85/Debt 75/EF 50 → `ksm_gate=true`, primary=KSM ✓; AC4 — final 74 tapi Debt 32 → FAIL, primary=DEBT_ADVICE + secondary LIVIN ✓; AC5 — final 52 + goal "Punya rumah" → readiness LOW, tidak KSM (goal tidak override) ✓. Plus Path B/C/E test.
- Verifikasi: 17 unit test ✓, typecheck ✓, lint ✓ (0 error, 1 warning generated file), build ✓.
- Referensi PRD: Bab F5, 8.2, 8.3, 8.4, 26 (AC3, AC4, AC5)
- Commit: <hash>

### [2026-08-30] Modul 6 (Scoring & Persona Engine) — SELESAI
- Engine scoring Financial Rating (F4) lengkap di `lib/scoring/` (sudah diimplementasikan sejak Modul 1, diverifikasi & ditandai selesai di modul ini).
- `constants.ts` (Bab 8.1): 6 dimensi berbobot (Cash Flow 25%, Debt Management 20%, Emergency Fund 20%, Saving Habit 15%, Investment Habit 10%, Financial Protection 10%), mapping question_id Q1-Q12 per dimensi, type DimensionStatus/Persona/Readiness/DimensionResult/RatingScoreResult.
- `rating.ts` (Bab 8.1): `classifyDimension` (80+ STRONG, 65-79 GOOD, 40-64 IMPROVE, 0-39 PRIORITY), `classifyPersona` (85+ ARCHITECT, 70-84 BUILDER, 55-69 EXPLORER, 40-54 ADVENTURER, 0-39 STARTER), `classifyReadiness` (70+ HIGH, 55-69 MEDIUM, 0-54 LOW), `calculateRatingScore` — raw score = rata-rata 2 soal per dimensi, contribution = raw × bobot, final = ROUND(sum) clamp 0-100; Q13/Q14 tidak pernah masuk hitungan (non-scoring, hanya personalisasi).
- `recommendation.ts` (Bab 8.2/8.3, dipakai Modul 7): `evaluateKsmGate` + `buildRatingRecommendation` Path A-E + Priority Rule — sudah diverifikasi di modul ini.
- Unit test AC1 & AC2 (Bab 26): AC1 — jawaban (100,80)/(85,90)/(65,35)/(100,80)/(65,80)/(60,80) → final score 77.75 dibulatkan **78** ✓; AC2 — final score 74 → persona **THE BUILDER** ✓. Boundary test persona (85/70/55/40/39) & readiness (70/55/54).
- Verifikasi: 17 unit test ✓ (10 scoring + 7 phone), typecheck ✓, lint ✓, build ✓.
- Referensi PRD: Bab F4, 8.1, 8.2, 8.3, 26 (AC1, AC2)
- Commit: <hash>

### [2026-08-30] Modul 1 selesai: setup deps (@supabase/supabase-js, @supabase/ssr, lucide-react, tsx), struktur lib/ (supabase client browser/server/admin, scoring engine rating + recommendation), env config.
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