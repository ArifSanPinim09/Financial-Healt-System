# TASKS — Financial Health & Credit Needs Assessment

> Breakdown task granular berdasarkan PRD v1.3 Final. Setiap task wajib mereferensikan Bab PRD terkait.

---

## Modul 1: Project Setup
- [x] Setup Next.js App Router dengan Tailwind CSS (ref: PRD Bab 5.1)
- [x] Install Lucide Icons (ref: PRD Bab 5.1, 20)
- [x] Setup struktur folder sesuai arsitektur (ref: PRD Bab 14)
- [x] Konfigurasi environment variables (Supabase URL, anon key, service role key) (ref: PRD Bab 5.1, 23)
- [x] Setup Supabase client (browser & server) (ref: PRD Bab 22)

## Modul 2: Supabase Setup
- [x] Buat tabel `question_bank` (ref: PRD Bab 12.1)
- [x] Buat tabel `question_option` (ref: PRD Bab 12.2)
- [x] Buat tabel `submission` dengan index unique (customer_phone, assessment_type) (ref: PRD Bab 12.3, F14)
- [x] Buat tabel `submission_answer` (ref: PRD Bab 12.4)
- [x] Buat tabel `dimension_result` (ref: PRD Bab 12.5)
- [x] Buat tabel `admin_profile` (FK ke auth.users) (ref: PRD Bab 12.6)
- [x] Buat tabel `cs_contact` dengan field round-robin (ref: PRD Bab 12.7)
- [x] Buat tabel `cs_rotation_state` untuk counter round-robin (ref: PRD Bab 12.7)
- [x] Buat tabel `submission_audit_log` (ref: PRD Bab 25)
- [x] Seed data `question_bank` + `question_option` untuk Financial Rating (Q1-Q14) (ref: PRD Bab 31)
- [x] Seed data `question_bank` + `question_option` untuk Financial Needs (Q1-Q10) (ref: PRD Bab 31)
- [x] Seed placeholder data `cs_contact` (3 nomor CS) (ref: PRD Bab 12.7, 29)
- [x] Setup RLS: question_bank/option = read-only publik (ref: PRD Bab 23)
- [x] Setup RLS: submission = insert-only publik, read untuk authenticated (ref: PRD Bab 23)
- [x] Setup RLS: submission_answer, dimension_result = read untuk authenticated (ref: PRD Bab 23)
- [x] Setup Supabase Auth untuk 1 akun admin (ref: PRD Bab 5.1, F11)
- [x] Generate TypeScript types dari schema (ref: PRD Bab 5.2)

## Modul 3: Landing Page (F1)
- [x] Buat halaman landing `/` dengan 2 kartu pilihan assessment (ref: PRD Bab 16.1, F1)
- [x] Styling mobile-first dengan Tailwind (ref: PRD Bab 19, 20)
- [x] Kartu: icon + judul + deskripsi + CTA (ref: PRD Bab 16.1)

## Modul 4: Identity Capture + Pembatasan 1x Isi (F13, F14)
- [x] Buat form identitas (nama, nomor HP) di awal quiz (ref: PRD Bab F13, 16.2)
- [x] Validasi format nomor HP Indonesia (ref: PRD Bab F13)
- [x] Cek existing submission berdasarkan (customer_phone, assessment_type) (ref: PRD Bab F14)
- [x] Jika sudah ada → redirect ke halaman hasil lama (skip quiz) (ref: PRD Bab F14)

## Modul 5: Financial Rating Quiz Engine (F2, F3)
- [x] Buat halaman quiz `/financial-health/quiz` (ref: PRD Bab 14, 16.2)
- [x] Komponen progress bar (ref: PRD Bab 16.2)
- [x] Komponen option card (radio-button style) (ref: PRD Bab 16.2)
- [x] Load pertanyaan dari API `/api/questions?type=RATING` (ref: PRD Bab 22)
- [x] Tampilkan 1 pertanyaan per layar (ref: PRD Bab 16.2)
- [x] Simpan jawaban di client state (local storage untuk refresh resilience) (ref: PRD Bab 11)
- [x] Tombol "Lanjut" aktif setelah pilih opsi (ref: PRD Bab 16.2)
- [x] Tombol "Kembali" untuk ubah jawaban sebelumnya (ref: PRD Bab 17)
- [x] Q13 (Financial Goal) & Q14 (Financial Need) non-scoring (ref: PRD Bab F3, 8.1)

## Modul 6: Scoring & Persona Engine (F4)
- [x] Implementasi perhitungan dimension raw score (rata-rata 2 soal) (ref: PRD Bab 8.1)
- [x] Implementasi weighted contribution (raw score × bobot) (ref: PRD Bab 8.1)
- [x] Implementasi final score = ROUND(sum contributions), clamp 0-100 (ref: PRD Bab 8.1)
- [x] Implementasi dimension health classification (Strong/Good/Improve/Priority) (ref: PRD Bab 8.1)
- [x] Implementasi persona mapping (Architect/Builder/Explorer/Adventurer/Starter) (ref: PRD Bab 8.1)
- [x] Implementasi readiness mapping (High/Medium/Low) (ref: PRD Bab 8.1)
- [x] Unit test untuk AC1 (perhitungan skor 77.75 → 78) (ref: PRD Bab 26)
- [x] Unit test untuk AC2 (persona THE BUILDER untuk skor 74) (ref: PRD Bab 26)

## Modul 7: KSM Gate & Recommendation Engine (F5)
- [ ] Implementasi KSM Gate: Final Score ≥70 AND Cash Flow ≥60 AND Debt ≥60 AND Emergency Fund ≥40 (ref: PRD Bab 8.2)
- [ ] Implementasi recommendation path A-E (ref: PRD Bab 8.3)
- [ ] Implementasi priority rule untuk multi-issue (ref: PRD Bab 8.3)
- [ ] Unit test untuk AC3 (KSM Gate PASS) (ref: PRD Bab 26)
- [ ] Unit test untuk AC4 (KSM Gate FAIL walau skor tinggi) (ref: PRD Bab 26)
- [ ] Unit test untuk AC5 (Goal tidak override Readiness) (ref: PRD Bab 26)

## Modul 8: Financial Rating Result Page + Loading (F6, F12)
- [ ] Implementasi loading experience bertahap (ref: PRD Bab F12)
  - "Analyzing your financial habits..."
  - "Looking at your financial patterns..."
  - "Finding your financial profile..."
- [ ] Buat halaman hasil `/financial-health/result` (ref: PRD Bab 16.3)
- [ ] Tampilkan skor besar, persona, deskripsi (ref: PRD Bab 16.3)
- [ ] Tampilkan grid 6 status dimensi dengan warna (ref: PRD Bab 16.3, 20)
- [ ] Tampilkan section "Your Next Move" dengan rekomendasi + CTA (ref: PRD Bab 16.3)
- [ ] CTA buka WhatsApp CS round-robin (ref: PRD Bab F6, 8.6)

## Modul 9: Financial Needs Quiz Engine (F7)
- [ ] Buat halaman quiz `/financial-needs/quiz` (ref: PRD Bab 14, 16.2)
- [ ] Load pertanyaan dari API `/api/questions?type=NEEDS` (ref: PRD Bab 22)
- [ ] Setiap opsi menambah skor ke 3 kategori (KSM/KPR/KKB) (ref: PRD Bab F7, 8.5)
- [ ] Simpan jawaban di client state (ref: PRD Bab 11)

## Modul 10: KSM/KPR/KKB Scoring & Tie-Breaker Engine (F8)
- [ ] Implementasi raw sum skor KSM/KPR/KKB (ref: PRD Bab 8.5)
- [ ] Implementasi threshold: selisih ≥5 → Strong, 3-4 → Recommendation, 1-2 → Dual (ref: PRD Bab 8.5)
- [ ] Implementasi tie-breaker berurutan: Actual Need → Urgency → Asset Gap → Life Stage (ref: PRD Bab 8.5)
- [ ] Implementasi "No Strong Recommendation" untuk skor berdekatan (ref: PRD Bab 8.5)
- [ ] Unit test untuk AC6 (Strong Recommendation) (ref: PRD Bab 26)
- [ ] Unit test untuk AC7 (Tie-Breaker by Actual Need) (ref: PRD Bab 26)
- [ ] Unit test untuk AC8 (No Strong Recommendation) (ref: PRD Bab 26)

## Modul 11: Financial Needs Result Page (F9)
- [ ] Buat halaman hasil `/financial-needs/result` (ref: PRD Bab 16.4)
- [ ] Tampilkan single recommendation card (ref: PRD Bab 16.4)
- [ ] Tampilkan dual recommendation cards dengan copy "kebutuhan berimbang" (ref: PRD Bab 16.4)
- [ ] CTA buka WhatsApp CS round-robin (ref: PRD Bab F9, 8.6)

## Modul 12: CTA WhatsApp Round-Robin
- [ ] Implementasi endpoint untuk increment counter & ambil nomor CS (ref: PRD Bab 12.7)
- [ ] Implementasi round-robin: last_used_index % jumlah_cs_aktif (ref: PRD Bab 12.7, F6)
- [ ] Generate link wa.me dengan prefill message (ref: PRD Bab F6)

## Modul 13: Admin Login (F11)
- [ ] Buat halaman login `/admin/login` (ref: PRD Bab 16.5)
- [ ] Integrasi Supabase Auth (signInWithPassword) (ref: PRD Bab F11, 23)
- [ ] Redirect ke dashboard setelah login sukses (ref: PRD Bab F11)
- [ ] Error handling: pesan generik "Email atau password salah" (ref: PRD Bab 16.5)

## Modul 14: Admin Dashboard — List & Filter (F10)
- [ ] Buat halaman dashboard `/admin/dashboard` (ref: PRD Bab 16.6)
- [ ] Proteksi route: redirect ke login jika belum auth (ref: PRD Bab 23)
- [ ] Tabel daftar submission (nama, tanggal, jenis, hasil ringkas) (ref: PRD Bab 16.6, 18)
- [ ] Filter: jenis assessment, rentang tanggal, jenis rekomendasi (ref: PRD Bab 18)
- [ ] Search: nama/nomor kontak (ref: PRD Bab 18)
- [ ] Sorting: tanggal (default terbaru), skor (ref: PRD Bab 18)
- [ ] Pagination: 20-25 baris/halaman (ref: PRD Bab 18)
- [ ] Responsive: tabel → card list di mobile (ref: PRD Bab 19)
- [ ] Empty state: "Belum ada data submission" (ref: PRD Bab 16.6)

## Modul 15: Admin Submission Detail — Edit/Delete + Audit Log (F10)
- [ ] Buat halaman detail `/admin/submission/:id` (ref: PRD Bab 16.7)
- [ ] Tampilkan info nasabah, hasil ringkas, detail jawaban (ref: PRD Bab 16.7)
- [ ] Tombol Edit: form untuk ubah nama/no HP/jawaban (ref: PRD Bab F10, 16.7)
- [ ] Tombol Hapus: modal konfirmasi + soft-delete (deleted_at) (ref: PRD Bab F10, 12.3)
- [ ] Implementasi audit log untuk setiap edit/delete (ref: PRD Bab 25)
- [ ] Toast feedback: "Perubahan disimpan" / "Data berhasil dihapus" (ref: PRD Bab 16.7)
- [ ] Unit test untuk AC9 (Admin Dashboard Access Control) (ref: PRD Bab 26)

## Modul 16: Responsive & Accessibility Pass
- [ ] Audit kontras warna (WCAG AA) (ref: PRD Bab 21)
- [ ] Keyboard navigation untuk opsi jawaban (ref: PRD Bab 21)
- [ ] Label form terhubung ke input (ref: PRD Bab 21)
- [ ] Target area tap minimal 44x44px (ref: PRD Bab 21)
- [ ] Font body minimal 16px (ref: PRD Bab 21)
- [ ] Error indication tidak hanya warna (tambah icon/teks) (ref: PRD Bab 21)
- [ ] Mobile: sticky button "Lanjut" di bawah (ref: PRD Bab 19)
- [ ] Mobile: filter dashboard di bottom sheet/modal (ref: PRD Bab 19)

## Modul 17: QA — Acceptance Criteria AC1-AC12
- [ ] Test AC1: Perhitungan Final Score (ref: PRD Bab 26)
- [ ] Test AC2: Persona berdasarkan Final Score (ref: PRD Bab 26)
- [ ] Test AC3: KSM Gate PASS (ref: PRD Bab 26)
- [ ] Test AC4: KSM Gate FAIL walau skor tinggi (ref: PRD Bab 26)
- [ ] Test AC5: Financial Goal tidak override Readiness (ref: PRD Bab 26)
- [ ] Test AC6: Financial Needs Strong Recommendation (ref: PRD Bab 26)
- [ ] Test AC7: Financial Needs Tie-Breaker (ref: PRD Bab 26)
- [ ] Test AC8: Financial Needs No Strong Recommendation (ref: PRD Bab 26)
- [ ] Test AC9: Admin Dashboard Access Control (ref: PRD Bab 26)
- [ ] Test AC10: Validasi Jawaban Lengkap (ref: PRD Bab 26)
- [ ] Test AC11: Identitas Wajib Sebelum Quiz (ref: PRD Bab 26)
- [ ] Test AC12: Pembatasan 1x Isi per Nomor HP (ref: PRD Bab 26)

---

## Dependency Graph (Urutan Pengerjaan)

```
Modul 1 (Setup) → Modul 2 (Supabase) → Modul 3 (Landing)
                                    ↓
                      Modul 4 (Identity) → Modul 5 (Rating Quiz) → Modul 6 (Scoring) → Modul 7 (KSM Gate)
                                          ↓                              ↓
                                          Modul 9 (Needs Quiz) ←─────────┘
                                                ↓
                                          Modul 10 (Tie-Breaker)
                                                ↓
                      Modul 8 (Rating Result) ←─┴─→ Modul 11 (Needs Result)
                              ↓                           ↓
                              └───────→ Modul 12 (CTA WA) ←┘
                                                    ↓
                      Modul 13 (Admin Login) → Modul 14 (Dashboard) → Modul 15 (Detail)
                                                    ↓
                                          Modul 16 (Responsive/A11y)
                                                    ↓
                                          Modul 17 (QA)
```

---

*Terakhir diupdate: 2026-08-30 (Modul 6 selesai)*
