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
- Commit: <hash>
- Deskripsi: Provisioning lengkap Supabase: 9 tabel (question_bank, question_option, submission + unique index (customer_phone, assessment_type), submission_answer, dimension_result, admin_profile, cs_contact, cs_rotation_state, submission_audit_log), seed 24 pertanyaan + 115 opsi (source of truth Bab 31, tervalidasi 1:1), placeholder 3 nomor CS + function round-robin `get_next_cs()`, RLS di 9 tabel (question_bank/option & cs_contact read publik; submission/submission_answer insert publik + read authenticated; dimension_result read authenticated; sisanya authenticated-only), akun admin Supabase Auth `admin@demo.com` (BRANCH_ADMIN) + admin_profile row, TS types diregenerasi. ⚠️ Security: service role key ter-commit di .env.example pada Modul 1 → dihapus dari file (tetap wajib rotate di dashboard karena masih di riwayat git).
- File terdampak: .env.example, lib/supabase/database.types.ts, docs/TASKS.md, docs/progress.md

