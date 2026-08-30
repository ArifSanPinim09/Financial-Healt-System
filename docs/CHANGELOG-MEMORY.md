# CHANGELOG-MEMORY — Financial Health & Credit Needs Assessment

> Memory log lintas-sesi. Setiap commit ke repo utama dicatat di sini, lalu file ini ikut di-commit dan di-push ke repo memory (Graphify) branch `financial-health-credit-quiz`.

Format entry:
```
## [<tanggal-jam>] <judul singkat perubahan>
- Commit: <hash commit repo utama>
- Deskripsi: <apa yang berubah, kenapa>
- File terdampak: <daftar file>
```

---

## [2026-08-30 20:45] Setup awal: AGENTS.md, progress.md, task planning
- Commit: 29af3db
- Deskripsi: Commit pertama project. Menetapkan konvensi (docs/, AGENTS.md), membuat planning task granular (TASKS.md, 116 task / 17 modul), template progress, dan memory log. Menyesuaikan AGENTS.md lama (808 baris template generik) menjadi versi ringkas berisi business rules kunci PRD.
- File terdampak: AGENTS.md, docs/TASKS.md, docs/progress.md, docs/CHANGELOG-MEMORY.md

## [2026-08-30 21:05] Modul 1 (Project Setup) + scoring engine Rating
- Commit: 3c96f49
- Deskripsi: Install deps (@supabase/supabase-js 2.112.4, @supabase/ssr, lucide-react, tsx), env config (.env.local ter-ignore, .env.example ter-commit), lib/supabase (client browser/server/admin + database.types.ts hasil generate), lib/scoring (constants, rating.ts, recommendation.ts). Engine scoring Rating + KSM Gate + recommendation diimplementasikan lengkap (Bab 8.1-8.3), 10 unit test lolos (AC1-AC5 + Path B/C/E). Konfirmasi service role key diisi manual.
- File terdampak: package.json, package-lock.json, .gitignore, .env.example, lib/supabase/*, lib/scoring/*, docs/TASKS.md, docs/progress.md

## [2026-08-30 22:45] Modul 2 (Supabase Setup) — SELESAI
- Commit: d858cee
- Deskripsi: Provisioning lengkap Supabase: 9 tabel (question_bank, question_option, submission + unique index (customer_phone, assessment_type), submission_answer, dimension_result, admin_profile, cs_contact, cs_rotation_state, submission_audit_log), seed 24 pertanyaan + 115 opsi (source of truth Bab 31, tervalidasi 1:1), placeholder 3 nomor CS + function round-robin `get_next_cs()`, RLS di 9 tabel (question_bank/option & cs_contact read publik; submission/submission_answer insert publik + read authenticated; dimension_result read authenticated; sisanya authenticated-only), akun admin Supabase Auth `admin@demo.com` (BRANCH_ADMIN) + admin_profile row, TS types diregenerasi. ⚠️ Security: service role key ter-commit di .env.example pada Modul 1 → dihapus dari file (tetap wajib rotate di dashboard karena masih di riwayat git).
- File terdampak: .env.example, lib/supabase/database.types.ts, docs/TASKS.md, docs/progress.md

## [2026-08-30 23:05] Modul 3 (Landing Page) — SELESAI
- Commit: 6a76c99
- Deskripsi: Landing page `/` (static, prerendered) sesuai F1/Bab 16.1: header wordmark "Livin'" + badge Demo, hero (heading serif line-mask reveal, copy hangat "bukan ujian", trust signals), 2 kartu assessment setara (Financial Health Score → /financial-health/quiz, Kebutuhan Kredit → /financial-needs/quiz) dengan icon + judul + deskripsi + CTA, footer dark + disclaimer business case. Design system Bab 20: palet 2 warna (warm paper + teal dalam), Fraunces (display) + Geist (body), Lucide Icons tanpa emoji, radius & shadow konsisten. Animasi CSS murni hormat prefers-reduced-motion: staggered rise-in per section, line-mask reveal heading, ambient glow drift, hover kartu (lift + icon tilt + arrow slide). A11y Bab 21: kontras WCAG AA, body ≥16px, tap target besar, focus-visible outline. Verifikasi: typecheck ✓, lint ✓, build static ✓, screenshot desktop+mobile ✓.
- File terdampak: app/page.tsx, app/layout.tsx, app/globals.css, docs/TASKS.md, docs/progress.md

## [2026-08-31 00:15] Modul 4 (Identity Capture + Pembatasan 1x Isi) — SELESAI
- Commit: <hash>
- Deskripsi: F13 — lib/utils/phone.ts (normalisasi 08xx/+62/628 → kanonik 62xx, 7 unit test) + form identitas nama & no HP di awal quiz (validasi ramah + contoh format, shake, loading, error retry) — AC11 lolos. F14 — POST /api/submission-check cek (customer_phone, assessment_type) via service-role di server (RLS melarang read publik, Bab 23), kembalikan hanya submission_id sendiri, exclude soft-delete, ambil terbaru jika >1; nomor sudah pernah submit jenis sama → state "Kamu sudah pernah mengisi ini" + auto-redirect ke /…/result?id=<lama> (skip quiz) — AC12 lolos; pembatasan per jenis (RATING 1x + NEEDS 1x). quiz-flow.tsx reusable RATING/NEEDS: phase identitas→quiz (area quiz placeholder untuk Modul 5/9), identitas persist sessionStorage via useSyncExternalStore (SSR-safe, refresh tidak ulang identitas, private-mode fallback in-memory) — refactor ini juga fix lint error React-compiler set-state-in-effect. globals.css: token error + animasi shake/progress-fill. Verifikasi: 17 unit test ✓, typecheck ✓, lint ✓ (0 error, 1 warning generated file), build ✓; uji API live (normalisasi 2 format, 400 INVALID_PHONE/INPUT/JSON, found:true+id, per-jenis) & uji browser (AC11, validasi, refresh persistence, Ubah, F14 redirect dgn id benar, NEEDS lanjut quiz) — seed test di-cleanup. Catatan: baris test lama "Tes Modul 4" (6281200001111, RATING) dari sesi sebelumnya masih di DB, menunggu keputusan user. Redirect F14 ke halaman hasil (404 saat ini — halaman hasil milik Modul 8/11, sesuai dependency graph).
- File terdampak: lib/utils/phone.ts, lib/utils/phone.test.ts, app/api/submission-check/route.ts, app/quiz/identity-form.tsx, app/quiz/quiz-flow.tsx, app/financial-health/quiz/page.tsx, app/financial-needs/quiz/page.tsx, app/globals.css, lib/scoring/rating.test.ts, package.json, docs/TASKS.md, docs/progress.md

