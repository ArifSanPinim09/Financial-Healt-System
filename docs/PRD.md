# PRODUCT REQUIREMENTS DOCUMENT (PRD)
## Financial Health & Credit Needs Assessment Web App

| | |
|---|---|
| **Dokumen** | Product Requirements Document |
| **Versi** | 1.3 (Final Draft — seluruh open question terjawab client, tech stack & dev workflow lengkap) |
| **Tanggal** | 29 Agustus 2026 |
| **Sumber** | Dokumen client "Kredit_Web.md" + 2 gambar flow + klarifikasi via chat WhatsApp (4 putaran) |
| **Status** | ✅ **Final — siap development.** Seluruh open question di Bab 29 sudah dijawab langsung oleh client. Sisa 2 item hanya berupa aset (3 nomor WA CS asli, logo jika ada nanti), tidak menghambat mulai development. |
| **Sifat Proyek** | **Demo / Business Case / Presentation tool** (bukan sistem produksi resmi milik perusahaan — dikonfirmasi client: *"belum perusahaan sih, untuk business case doang, presentasi, ga bakalan dipake perusahaannya"*) |

> **Catatan penting sebelum membaca PRD ini:**
> Karena project ini secara eksplisit disebutkan oleh client **bukan untuk dipakai perusahaan** dan sifatnya demo/presentasi, seluruh rekomendasi di PRD ini dibuat dengan asumsi *skala kecil, MVP, biaya rendah* — sesuai juga dengan budget yang dibicarakan (kisaran Rp400.000–500.000 termasuk hosting) dan timeline singkat (±1 minggu). PRD tetap dibuat selengkap mungkin agar development terarah, namun rekomendasi arsitektur/keamanan disesuaikan dengan konteks "demo", bukan "production banking system".

---

## 1. EXECUTIVE SUMMARY

Sistem yang diminta adalah sebuah **web application** yang diakses nasabah melalui link (dibagikan secara manual lewat WhatsApp, bukan WA Blast otomatis). Website menyajikan dua pilihan assessment finansial:

1. **Financial Rating Assessment** ("Financial Health Score") — nasabah menjawab 12 pertanyaan pilihan ganda untuk mengukur 6 dimensi kesehatan finansial, mendapatkan skor 0–100, persona, dan rekomendasi produk (KSM Opportunity / CASA-Saving / Livin' / Financial Advice).
2. **Financial Needs Assessment** ("Kebutuhan Kredit") — nasabah menjawab 10 pertanyaan untuk menentukan kebutuhan kredit yang paling relevan di antara 3 produk: **KSM, KPR, KKB**, menggunakan sistem skor akumulatif (raw sum) dan aturan tie-breaker bertingkat.

Hasil dari kedua assessment ditampilkan ke nasabah dalam bentuk hasil yang ramah (bukan seperti "ujian"), dan datanya masuk ke **dashboard admin/cabang** untuk keperluan monitoring dan follow-up oleh pihak bank/cabang.

---

## 2. BACKGROUND

Client ingin membuat sebuah *lead qualification tool* berbasis kuis finansial yang dapat digunakan sebagai bahan presentasi/business case, mensimulasikan bagaimana sebuah bank dapat mengarahkan nasabah ke produk yang tepat (tabungan, kredit mikro/serbaguna, KPR, KKB) berdasarkan jawaban perilaku finansial mereka, tanpa nasabah merasa sedang "dinilai" secara kaku.

Konsep ini terinspirasi dari pola *financial wellness quiz* yang umum dipakai fintech/bank digital: kuis ringan, hasil personal (skor + "persona"), lalu cross-sell produk yang relevan berdasarkan decision engine, bukan penawaran generik.

---

## 3. PROBLEM STATEMENT

- Nasabah umumnya tidak tahu produk keuangan mana yang sebenarnya paling relevan dengan kondisi mereka (tabungan, kredit, dsb).
- Penawaran produk yang generik (bukan berbasis kondisi aktual nasabah) menurunkan tingkat konversi dan relevansi.
- Tim cabang tidak punya cara mudah untuk mengumpulkan sinyal minat & kondisi finansial calon nasabah sebelum melakukan follow-up.
- **(Konteks tambahan dari chat)**: Dibutuhkan alat demo yang bisa dipresentasikan sebagai *business case*, untuk menunjukkan bagaimana proses ini *bisa* berjalan — tanpa harus terintegrasi dengan sistem resmi bank.

---

## 4. OBJECTIVES

1. Nasabah dapat menyelesaikan salah satu dari dua assessment finansial secara mandiri melalui web, dalam bahasa yang mudah dipahami (self-discovery, bukan ujian).
2. Sistem secara otomatis menghitung skor, kategori/persona, dan rekomendasi produk berdasarkan business rules yang telah didefinisikan client.
3. Hasil assessment tersimpan dan dapat dipantau melalui dashboard admin/cabang.
4. Seluruh logic (scoring, gate, tie-breaker) dapat diverifikasi dan diuji sesuai contoh kasus yang diberikan client di dokumen.

---

## 5. SCOPE

### In Scope (MVP demo)
- Landing page dengan 2 pilihan assessment.
- Flow **Financial Rating Assessment** (12 pertanyaan scoring + 2 pertanyaan non-scoring) lengkap dengan mesin skor, gate KSM, dan rekomendasi.
- Flow **Financial Needs Assessment** (10 pertanyaan) lengkap dengan mesin skor KSM/KPR/KKB dan tie-breaker.
- Halaman hasil (result page) untuk masing-masing flow, dengan loading experience bertahap sesuai instruksi dokumen ("self-discovery", bukan "Calculating score...").
- Dashboard admin/cabang berbasis login untuk melihat daftar hasil submission nasabah.
- Hosting agar dapat diakses publik melalui link.

### Out of Scope (dikonfirmasi eksplisit via chat)
- **Integrasi WhatsApp Business API / WA Blast otomatis** — client & admin sepakat ini tidak diperlukan karena butuh pendaftaran resmi ke Meta dan berbayar mahal; distribusi cukup lewat link yang dibagikan manual.
- Integrasi ke core banking system / sistem pengajuan kredit resmi (proses ini berhenti di "rekomendasi", bukan pengajuan aktual).
- Proses approval kredit sungguhan, verifikasi dokumen, scoring risiko kredit resmi (BI Checking/SLIK dll).

### Future Scope (V2+, tidak dikerjakan sekarang)
- Manajemen bank soal (CMS untuk admin mengubah pertanyaan/skor tanpa ubah kode).
- Multi-cabang dengan akses dashboard terpisah per cabang.
- Integrasi WA Business API resmi jika proyek naik status menjadi resmi milik perusahaan.
- Export laporan otomatis, notifikasi email/WA ke tim follow-up.
- Autentikasi nasabah (akun nasabah, riwayat assessment).

> **Assumption / Need Confirmation:** Karena tidak ada pernyataan eksplisit soal integrasi sistem lain di luar 2 assessment ini, seluruh scope di atas diasumsikan berdiri sendiri (standalone web app), tidak terhubung ke sistem bank manapun. Perlu dikonfirmasi bila ternyata ada ekspektasi integrasi tersembunyi.

### 5.1 Tech Stack & Arsitektur Teknis ✅ FINAL

Client menyerahkan pilihan bahasa/teknologi ke tim dev ("apa aja sih mas"). Stack yang dipilih:

| Layer | Teknologi | Alasan Pemilihan |
|---|---|---|
| **Frontend + Server Logic** | **Next.js** (App Router) | 1 framework untuk UI, routing, dan backend logic (API/Server Actions) sekaligus — cocok untuk timeline singkat (±1 minggu) dan tim kecil. Mobile-first rendering cepat (SSR/CSR sesuai kebutuhan halaman). |
| **Database + Auth** | **Supabase** (Postgres) | Managed Postgres gratis di tier awal, sudah termasuk **Supabase Auth** (dipakai untuk login Admin — menggantikan tabel `admin_user` custom + hashing manual di Bab 12.6), **Row Level Security (RLS)** untuk kontrol akses data submission, dan **Realtime** (opsional: dashboard admin bisa auto-update tanpa refresh saat ada submission baru — nilai tambah di luar scope awal, murah untuk diaktifkan). |
| **Hosting/Deploy** | **Vercel** | Deploy langsung dari Git, cocok untuk aplikasi Next.js (dibuat oleh tim yang sama), auto-preview per perubahan (memudahkan proses demo/review ke client), tier gratis cukup untuk skala demo. |
| **Styling/UI** | Tailwind CSS + **Lucide Icons** | Konsisten dengan design system Bab 20; Lucide dipakai untuk seluruh icon (status dimensi, kategori goal, dsb) — lihat keputusan soal icon di Bab 29. |

**Perubahan pada bab lain akibat pilihan stack ini:**
- **Bab 12.6 (`admin_user`):** Tabel custom + password hash **tidak lagi diperlukan** — login admin memakai **Supabase Auth** bawaan (email+password), lebih aman & lebih cepat diimplementasikan.
- **Bab 22 (API):** Endpoint diimplementasikan sebagai **Next.js Route Handler** (`app/api/.../route.ts`) yang memanggil **Supabase client** (server-side, pakai service role key khusus untuk operasi tervalidasi seperti insert submission).
- **Bab 23 (Security):** Kontrol akses data ditegakkan lewat **Supabase RLS**: tabel `question_bank`/`question_option` bisa dibaca publik (read-only), tabel `submission` hanya bisa **insert** oleh publik (tanpa hak baca), dan hanya role admin (`authenticated` via Supabase Auth) yang bisa **membaca, mengubah (update), dan soft-delete** data submission (sesuai keputusan client di Bab 29 — admin boleh edit/hapus). Service role key backend disimpan sebagai environment variable di Vercel, tidak pernah dikirim ke browser.
- **Bab 24 (Performance):** Vercel Edge Network mempercepat load halaman quiz untuk nasabah mobile; Next.js image/asset optimization otomatis dipakai untuk aset visual.

**Arsitektur ringkas:**
```
Nasabah (browser mobile) ─┐
                          ├──► Next.js App (Vercel) ──► Supabase (Postgres + Auth + RLS)
Admin (browser, login) ───┘
```

### 5.2 Development Workflow — Supabase MCP ✅ DITAMBAHKAN

Untuk mempercepat proses development (timeline ±1 minggu), tim dev menggunakan **Supabase MCP (Model Context Protocol) server** yang dihubungkan ke AI coding tool (mis. Claude Code) selama proses build. Ini adalah **tooling di sisi development**, bukan bagian dari aplikasi yang dipakai nasabah/admin di production.

**Yang dilakukan lewat Supabase MCP selama development:**
- **Provisioning schema:** Membuat seluruh tabel sesuai Bab 12 (`question_bank`, `question_option`, `submission`, `submission_answer`, `dimension_result`, `cs_contact`, `submission_audit_log`, dsb) langsung dari coding environment, tanpa perlu klik manual satu-satu di Supabase Dashboard.
- **Menulis & menjalankan migration SQL** (termasuk setup **RLS policies** sesuai Bab 23) secara terversi, memudahkan rollback bila ada kesalahan skema.
- **Setup Supabase Auth** untuk 1 akun admin awal (sesuai keputusan Bab 29 — cukup 1 akun).
- **Generate TypeScript types** otomatis dari schema database, dipakai di kode Next.js agar query ke Supabase type-safe (mengurangi bug saat development cepat).
- **Cek log & debug query** langsung dari coding environment saat testing alur submission/scoring, tanpa bolak-balik ke Supabase Dashboard.

**Catatan penting:** Supabase MCP hanya dipakai **selama fase development** oleh tim dev sebagai akselerator kerja. Aplikasi yang di-deploy ke Vercel untuk nasabah & admin tetap berjalan normal lewat Next.js + Supabase client biasa (Bab 22) — **tidak bergantung** pada MCP saat runtime production.

---

## 6. USER & ROLE ANALYSIS

### 6.1 Daftar Role

| Role | Tujuan Penggunaan | Login? |
|---|---|---|
| **Nasabah / Calon Nasabah (Guest)** | Mengisi salah satu assessment dan melihat hasil rekomendasi pribadinya | ✅ **Tidak perlu login/registrasi** — cukup isi nama & no. HP di awal (lihat F13) |
| **Admin Cabang (Branch Admin)** | Memantau hasil assessment nasabah untuk keperluan follow-up | ✅ **Wajib login** (username + password) |
| **Super Admin** *(Future Scope)* | Mengelola pertanyaan, bobot skor, dan akun admin cabang lain | Login + role lebih tinggi |

> **✅ Dikonfirmasi client:** Login hanya wajib untuk Admin. Nasabah tidak perlu registrasi/login — identitas cukup diambil dari isian nama & no. HP di awal quiz (lihat F13 — Identity Capture, Bab 10).

### 6.2 Role Permission Matrix

| Data / Aksi | Nasabah (Guest) | Admin Cabang | Super Admin (Future) |
|---|---|---|---|
| Mengisi Financial Rating Assessment | ✅ Create | ❌ | ❌ |
| Mengisi Financial Needs Assessment | ✅ Create | ❌ | ❌ |
| Melihat hasil assessment miliknya sendiri | ✅ Read | — | — |
| Melihat daftar seluruh submission nasabah | ❌ | ✅ Read | ✅ Read |
| Melihat detail 1 submission nasabah | ❌ | ✅ Read | ✅ Read |
| Filter / cari / sort data submission | ❌ | ✅ | ✅ |
| Export data (CSV/Excel) | ❌ | ✅ *(jika dikonfirmasi dibutuhkan)* | ✅ |
| Edit/hapus data submission nasabah | ❌ | ✅ *(dikonfirmasi client — dengan audit trail & soft-delete, lihat Bab 25)* | ✅ |
| Mengelola daftar pertanyaan & skor | ❌ | ❌ | ✅ *(Future Scope)* |
| Mengelola akun admin lain | ❌ | ❌ | ✅ *(Future Scope)* |

---

## 7. BUSINESS REQUIREMENTS

### Business Objective
Menyediakan alat digital self-assessment yang dapat mendemonstrasikan bagaimana bank dapat mengarahkan nasabah ke produk yang relevan (tabungan/kredit) berdasarkan kondisi finansial aktual mereka, bukan penawaran acak.

### Problem Statement
(Lihat Bab 3.)

### Goals
- Nasabah menyelesaikan assessment dan mendapat hasil yang terasa personal & actionable.
- Tim cabang mendapat data terstruktur (skor, dimensi, rekomendasi produk) untuk setiap submission.
- Business rules (gate KSM, tie-breaker KSM/KPR/KKB) berjalan 100% sesuai contoh kasus di dokumen client.

### Success Metrics
> **Assumption / Need Confirmation:** Dokumen client tidak menyebutkan target metrik kuantitatif (mis. jumlah submission, conversion rate ke KSM, dsb) karena sifatnya masih demo. Untuk keperluan PRD, diusulkan metrik indikatif berikut — **perlu dikonfirmasi/disesuaikan client**:
- Tingkat penyelesaian quiz (completion rate) dari mulai → hasil akhir.
- Distribusi hasil rekomendasi (berapa % diarahkan ke KSM vs CASA vs Livin' vs Advice).
- Akurasi fungsional: 100% hasil perhitungan cocok dengan seluruh contoh kasus di dokumen (dipakai sebagai test case QA, lihat Bab 26).

### Scope
(Lihat Bab 5.)

---

## 8. BUSINESS RULES (KONSOLIDASI)

Ini adalah rules inti yang **wajib** diimplementasikan persis sesuai dokumen client — tidak boleh diinterpretasikan bebas oleh developer.

### 8.1 Financial Rating Assessment — Aturan Perhitungan

| Dimensi | Bobot | Pertanyaan |
|---|---|---|
| Cash Flow | 25% | Q1–Q2 |
| Debt Management | 20% | Q3–Q4 |
| Emergency Fund | 20% | Q5–Q6 |
| Saving Habit | 15% | Q7–Q8 |
| Investment Habit | 10% | Q9–Q10 |
| Financial Protection | 10% | Q11–Q12 |

- **Dimension Raw Score** = rata-rata skor 2 pertanyaan pada dimensi tsb.
- **Weighted Score (Contribution)** = Dimension Raw Score × Bobot Dimensi.
- **Final Score** = jumlah seluruh *Contribution* dari 6 dimensi, dibulatkan (`ROUND()`), range wajib 0–100.
- Q13 (Financial Goal) dan Q14 (Financial Need) **tidak memengaruhi skor** — hanya disimpan untuk personalisasi rekomendasi.

**Dimension Health Classification** (untuk ditampilkan per-dimensi, bukan penentu persona):

| Skor | Status |
|---|---|
| 80–100 | STRONG |
| 65–79 | GOOD |
| 40–64 | IMPROVE |
| 0–39 | PRIORITY |

**Financial Persona** (ditentukan hanya dari Final Score, dipakai untuk customer experience):

| Final Score | Persona |
|---|---|
| 85–100 | THE ARCHITECT |
| 70–84 | THE BUILDER |
| 55–69 | THE EXPLORER |
| 40–54 | THE ADVENTURER |
| 0–39 | THE STARTER |

**Financial Readiness** (berbeda dari Persona; dipakai oleh decision engine, bukan ditampilkan sebagai identitas customer):

| Final Score | Readiness |
|---|---|
| 70–100 | HIGH |
| 55–69 | MEDIUM |
| 0–54 | LOW |

> Catatan penting: Readiness **HIGH tidak otomatis berarti KSM** — wajib lolos KSM Gate terlebih dahulu.

### 8.2 KSM Gate (Decision Engine)

KSM hanya boleh menjadi **Primary Recommendation** jika **SEMUA** kondisi berikut terpenuhi:

```
Final Score        >= 70
AND Cash Flow      >= 60
AND Debt Management>= 60
AND Emergency Fund >= 40
```

Jika salah satu syarat tidak terpenuhi → KSM Gate = **FAIL**, walaupun Final Score tinggi (lihat contoh "KSM Fail" di dokumen: Final Score 74/THE BUILDER tapi Debt Management = 32 → tetap FALSE karena Debt < 60).

### 8.3 Recommendation Engine (setelah KSM Gate)

| Path | Kondisi | Rekomendasi |
|---|---|---|
| A | KSM Gate PASS | **KSM Opportunity** |
| B | Emergency Fund < 60 **atau** Saving Habit < 60 (prioritaskan Emergency Fund bila keduanya bermasalah) | **CASA / Saving** |
| C | Cash Flow < 60 | **Livin'** *(lihat catatan branding di 8.5)* |
| D | Debt Management < 60 | **Debt Management Advice**, dapat dilanjutkan ke Livin' |
| E | ≥2 dimensi dengan skor < 40 | **Jangan push produk spesifik** → tampilkan Financial Advice + Saving/CASA + Livin' + konten edukasi |

**Priority Rule** bila nasabah punya banyak masalah sekaligus (urutan prioritas dimensi yang ditangani lebih dulu bila skor <40):
1. Debt Management
2. Cash Flow
3. Emergency Fund
4. Saving
5. Financial Protection
6. Investment

> Untuk KSM, urutan ini tidak berlaku — KSM Gate selalu dicek terlebih dahulu secara terpisah.

### 8.4 Financial Goal vs Financial Readiness

**Aturan tegas:** Financial Goal (Q13) **tidak boleh** meng-override Financial Readiness. Goal hanya memperkuat relevansi *bahasa* rekomendasi (personalisasi copy), bukan menentukan kelayakan produk. Contoh dari dokumen: Score 52 + Goal "Punya rumah" **tetap** LOW readiness → tetap diarahkan ke Financial Foundation/CASA/Advice, bukan otomatis KSM.

### 8.5 Financial Needs Assessment — Aturan Skoring KSM/KPR/KKB

- Skor dihitung dari **10 pertanyaan**, setiap pilihan jawaban menambahkan poin ke 3 kategori sekaligus (KSM, KPR, KKB) dengan nilai berbeda-beda (lihat tabel lengkap di Bab 31 - Appendix).
- **Perhitungan skor akhir = raw sum** (dijumlah polos, **tanpa bobot tambahan**) — *dikonfirmasi eksplisit oleh client via chat: "raw sum aja mas".*

**Logika Penentuan Hasil (urutan wajib diikuti persis):**

1. Hitung total skor KSM, KPR, KKB.
2. Cari skor tertinggi.
3. **Jika ada skor tertinggi yang jelas:**
   - Selisih ≥ 5 → **Strong Recommendation** (1 produk, confidence tinggi).
   - Selisih 3–4 → **Recommendation** (1 produk, confidence moderate).
   - Selisih 1–2 → **Dual Recommendation** (tampilkan 2 produk teratas).
4. **Jika skor sama persis (tie)** → jalankan **Tie-Breaker Rule** berurutan:
   1. **Actual Need** (jawaban Q7 — tujuan penggunaan dana) — prioritas tertinggi.
   2. **Urgency** (jawaban Q9 — makin cepat makin diprioritaskan).
   3. **Existing Asset Gap** (kepemilikan rumah/kendaraan saat ini — makin besar gap makin diprioritaskan).
   4. **Life Stage** (Q1) — hanya sebagai *supporting factor* terakhir, **bukan** aturan umum seperti "sudah menikah → otomatis KSM".
5. Jika setelah tie-breaker tetap tidak bisa dibedakan **ATAU** ketiga skor berdekatan (contoh: 28/29/27) → **No Strong Recommendation**, tampilkan **Dual/Multi Recommendation** dengan copy: *"Dari jawabanmu, kebutuhanmu terlihat cukup berimbang..."* + pilihan untuk melihat kedua produk.

**Threshold Table (ringkasan):**

| Kondisi Selisih Skor | Output |
|---|---|
| ≥ 5 | Strong Recommendation |
| 3–4 | Recommendation |
| 1–2 | Dual Recommendation |
| 0 (sama persis) | Tie-Breaker Rule |
| Ketiga skor sangat berdekatan | No Strong Recommendation (tampilkan multi) |

### 8.6 Catatan Branding — ✅ CONFIRMED

> **Update (dikonfirmasi client):** Client sudah mengizinkan nama **"Livin'"** dipakai apa adanya di demo ini ("Gapapa mas pake itu aja"). Jadi nama produk tetap **Livin'**, tidak perlu diganti placeholder. Istilah KSM/KPR/KKB juga tetap dipakai sesuai dokumen asli.

### 8.7 Pembatasan Pengisian — ✅ CONFIRMED

> **Update (dikonfirmasi client):** Nasabah **hanya boleh mengisi assessment 1x** ("Hanya sekali aja mas perorangnya"). Karena tidak ada akun/login nasabah, aturan ini ditegakkan menggunakan **nomor HP** yang diisi di awal (F13) sebagai identifier unik — lihat detail implementasi di F14 (Bab 10) dan Edge Case terkait (Bab 11).
> *Masih perlu dikonfirmasi:* apakah batas 1x ini berlaku **per jenis assessment** (boleh isi Financial Health 1x DAN Financial Needs 1x) atau **1x total** dari kedua assessment manapun — lihat Bab 29.

---

## 9. USER FLOW & BUSINESS FLOW ANALYSIS

### 9.1 Analisis Gambar 1 — Flow Financial Rating Assessment

Flow pada gambar:
```
WHATSAPP → FINANCIAL QUIZ → 12 SCORING Qs
   ├─ 6 DIMENSIONS → SUB-SCORES → FINAL SCORE → PERSONA → FINANCIAL READINESS ─┐
   └─ 2 NON-SCORING (GOAL / NEED) ───────────────────────────────────────────┘
                                          ↓
                                      KSM GATE
                              ┌────────────┴────────────┐
                            PASS                        FAIL
                              ↓                            ↓
                             KSM                CHECK LOWEST DIMENSION
                                          ┌──────────────┼──────────────┐
                                     CASH FLOW      DEBT ISSUE     SAVING/EMERGENCY
                                          ↓               ↓                ↓
                                       LIVIN'          ADVICE            CASA
```

**⚠️ Konflik/Gap yang teridentifikasi:** Gambar ini **hanya** menggambarkan alur *Financial Quiz* (Assessment 1) secara detail. Namun ada catatan tangan di sebelah gambar: *"Disini selain 'Financial Quiz' ada 'Financial Needs'"* — ini menunjukkan bahwa diagram belum menggambarkan percabangan awal yang sebenarnya. Berdasarkan teks dokumen bagian pembuka ("Website ini akan menampilkan **dua pilihan**... Nasabah bebas memilih"), flow yang benar seharusnya:

```
WHATSAPP LINK → LANDING PAGE (2 pilihan)
   ├── Pilihan 1: Financial Rating Assessment → (flow seperti gambar 1)
   └── Pilihan 2: Financial Needs Assessment → (flow seperti gambar 2)
```

**Rekomendasi:** Landing page harus secara eksplisit menampilkan 2 kartu/tombol pilihan assessment, bukan langsung masuk ke Financial Quiz. Ini yang dipakai sebagai flow resmi di PRD ini.

**Breakdown Step-by-Step (Financial Rating Assessment):**

| # | Siapa Mulai | Trigger | Aksi User | Aksi Sistem | Data Berubah | Validasi | Approval | Sukses | Gagal | Kondisi Akhir |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Nasabah | Klik link dari WA | Buka landing page | Render 2 pilihan | – | – | – | Landing tampil | Link rusak/expired → error page | Nasabah di landing page |
| 2 | Nasabah | Pilih "Financial Health Score" | Klik CTA | Mulai render Q1 | Session baru dibuat | – | – | Q1 tampil | – | Nasabah di Q1 |
| 3 | Nasabah | Menjawab Q1–Q12 | Pilih 1 dari 5 opsi tiap soal | Simpan jawaban+skor per soal, lanjut ke soal berikut | Jawaban tersimpan di session/DB sementara | Wajib pilih 1 opsi sebelum lanjut | Tidak ada | Progress bertambah | Belum pilih → tombol "Lanjut" disabled | Semua 12 jawaban tersimpan |
| 4 | Nasabah | Menjawab Q13 & Q14 | Pilih goal & need | Simpan sebagai `financial_goal`, `financial_need` (non-scoring) | Data tersimpan | Wajib pilih 1 opsi | Tidak ada | Lanjut ke submit | – | Semua 14 jawaban lengkap |
| 5 | Nasabah | Klik "Submit"/selesai Q14 | – | Hitung dimension score → final score → persona → readiness → KSM Gate → recommendation | Insert 1 record submission lengkap ke DB | Pastikan semua 14 jawaban ada | Tidak ada | Lanjut ke loading screen | Data tidak lengkap → tampilkan soal yang terlewat | Submission tersimpan |
| 6 | Sistem | Otomatis | – | Tampilkan loading message bertahap (lihat 8.x Loading Experience) selama beberapa detik | – | – | – | Lanjut ke result page | Timeout/error → retry atau pesan error ramah | Result page tampil |
| 7 | Nasabah | Lihat hasil | Baca skor, persona, kondisi 6 dimensi, rekomendasi | Render sesuai data hasil kalkulasi | – | – | – | Hasil tampil lengkap + CTA | – | Flow selesai (nasabah bisa klik CTA rekomendasi) |
| 8 | Sistem (background) | Setelah submit | – | Kirim data submission ke Admin Dashboard | Data muncul di list admin | – | – | Admin bisa lihat data real-time/near real-time | – | Data tersedia untuk follow-up |

### 9.2 Analisis Gambar 2 — Framework Financial Needs Assessment

```
10 JAWABAN NASABAH → SCORE KSM/KPR/KKB → ADA SKOR TERTINGGI?
        ┌───────────────────────────┴───────────────────────────┐
       YA                                                      TIDAK (skor sama)
        ↓                                                          ↓
  Selisih ≥ 5?                                              TIE-BREAKER
   ┌────┴────┐                                          (Actual Need → Urgency →
  YA        TIDAK                                        Asset Gap → Life Stage)
   ↓          ↓                                                    ↓
STRONG    (masuk ke pengecekan                                     │
RECOM.     "bisa dibedakan?")                                      │
   └──────────────┬─────────────────────────────────────────────┘
                   ↓
         ┌─────────┴─────────┐
    Bisa dibedakan       Tidak bisa
         ↓                    ↓
     1 PRODUCT           2 PRODUCT
              RECOMMENDATION
```

**Breakdown Step-by-Step (Financial Needs Assessment):**

| # | Siapa Mulai | Trigger | Aksi User | Aksi Sistem | Data Berubah | Validasi | Approval | Sukses | Gagal | Kondisi Akhir |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Nasabah | Pilih "Financial Needs" di landing | Klik CTA | Mulai render Q1 dari 10 pertanyaan | Session baru | – | – | Q1 tampil | – | Nasabah di Q1 |
| 2 | Nasabah | Menjawab Q1–Q10 | Pilih 1 dari 4–6 opsi (bervariasi per soal) | Tambahkan poin ke akumulator KSM/KPR/KKB sesuai tabel skor | Skor sementara tersimpan | Wajib pilih 1 opsi tiap soal | Tidak ada | Progress bertambah | Belum pilih → tombol disabled | Semua 10 jawaban tersimpan |
| 3 | Nasabah | Klik submit setelah Q10 | – | Jalankan algoritma: hitung total → cek skor tertinggi → cek selisih → (jika perlu) tie-breaker | Insert record submission | Semua 10 jawaban lengkap | Tidak ada | Lanjut ke loading | Data tidak lengkap → tampilkan soal terlewat | Hasil rekomendasi ditentukan |
| 4 | Sistem | Otomatis | – | Tampilkan loading experience (konsisten dengan flow 1) | – | – | – | Lanjut ke result page | Timeout → retry | Result page tampil |
| 5 | Nasabah | Lihat hasil | Baca rekomendasi (1 atau 2 produk) | Render hasil sesuai `primary_recommendation` (+ `secondary_recommendation` jika dual) | – | – | – | Hasil tampil + CTA lihat produk | – | Flow selesai |
| 6 | Sistem (background) | Setelah submit | – | Kirim data ke Admin Dashboard | Data muncul di list admin | – | – | Tersedia untuk follow-up | – | Data tersedia |

> **✅ Resolved:** Q1 dan Q6 pada Financial Needs Assessment memang hanya memiliki 3 opsi (a–c) — dikonfirmasi client bahwa opsi "d." yang kosong di dokumen asli bukan data yang hilang.

---

## 10. FUNCTIONAL REQUIREMENTS / FEATURE SPECIFICATION

### F1 — Landing Page (Pilihan Assessment)
- **Purpose:** Titik masuk utama, memungkinkan nasabah memilih 1 dari 2 assessment.
- **User:** Nasabah (guest).
- **Preconditions:** Nasabah membuka link valid.
- **Main Flow:** Nasabah melihat 2 kartu pilihan (Financial Health / Financial Needs) → klik salah satu → diarahkan ke quiz terkait.
- **Alternative Flow:** Nasabah menutup tab sebelum memilih → tidak ada data tersimpan (tidak dianggap submission).
- **Validation:** Tidak ada input, hanya navigasi.
- **Business Rules:** Kedua pilihan setara, tidak ada yang "didahulukan"/direkomendasikan secara default.
- **Success State:** Redirect ke halaman Q1 flow yang dipilih.
- **Error State:** Link rusak → tampilkan halaman 404 ramah dengan CTA kontak.
- **Data Required:** – | **Data Generated:** `session_id`, `assessment_type` terpilih.
- **Permission:** Publik.
- **Audit Trail:** Catat `assessment_type_selected` + timestamp (opsional, untuk analytics funnel).

### F2 — Financial Quiz Engine (12 Pertanyaan Scoring)
- **Purpose:** Mengumpulkan jawaban 12 pertanyaan lintas 6 dimensi.
- **User:** Nasabah.
- **Preconditions:** Sudah memilih "Financial Health Score" di landing.
- **Main Flow:** Tampilkan 1 pertanyaan per layar (atau per section) → nasabah pilih opsi → skor opsi disimpan di background (tidak terlihat nasabah, sesuai dokumen: *"Pilihan tidak perlu menampilkan score ke nasabah"*) → lanjut otomatis/klik "Lanjut" → ulangi hingga Q12.
- **Alternative Flow:** Nasabah klik "Kembali" untuk mengubah jawaban sebelumnya — ✅ *disediakan (keputusan tim dev, lihat Bab 29)*.
- **Validation:** 1 pertanyaan = wajib 1 jawaban sebelum lanjut.
- **Business Rules:** Skor per opsi mengikuti tabel di Bab 31.
- **Success State:** Semua 12 jawaban lengkap → lanjut ke Q13/Q14.
- **Error State:** Koneksi terputus saat submit jawaban → tampilkan retry, jangan hilangkan progress yang sudah diisi (simpan di local state/session).
- **Data Required:** Daftar pertanyaan & opsi (lihat Bab 31). **Data Generated:** Array jawaban `{question_id, option_id, score}`.
- **Permission:** Publik.
- **Audit Trail:** Tidak perlu detail per-klik, cukup simpan jawaban final per submission.

### F3 — Goal & Need Capture (Q13 & Q14, Non-Scoring)
- **Purpose:** Menangkap tujuan finansial & kebutuhan saat ini untuk personalisasi (bukan skor).
- **User:** Nasabah.
- **Preconditions:** Sudah menyelesaikan Q1–Q12.
- **Main Flow:** Tampilkan Q13 (Financial Goal, 8 opsi) → Q14 (Financial Need, 6 opsi) → simpan sebagai `financial_goal` & `financial_need`.
- **Business Rules:** Field ini **tidak boleh** memengaruhi kalkulasi skor/readiness/KSM Gate (lihat Bab 8.4) — hanya dipakai untuk copy personalisasi di halaman hasil.
- **Success/Error State:** Sama pola dengan F2.
- **Data Generated:** `financial_goal` (enum A–H), `financial_need` (enum A–F).
- **Permission:** Publik.

### F4 — Scoring & Persona Engine (Backend Logic)
- **Purpose:** Menghitung dimension score, final score, persona, readiness sesuai formula Bab 8.1.
- **User:** Sistem (triggered otomatis saat submit).
- **Preconditions:** 12 jawaban scoring lengkap.
- **Main Flow:** Hitung raw score per dimensi → hitung contribution (×bobot) → jumlahkan → `ROUND()` → tentukan persona & readiness dari tabel.
- **Business Rules:** Formula wajib persis sesuai Bab 8.1 — tervalidasi dengan contoh kasus di dokumen (Final Score 77.75 dari contoh perhitungan harus menghasilkan angka yang sama persis saat dites).
- **Error State:** Jika hasil di luar 0–100 (seharusnya tidak mungkin secara matematis bila skor opsi valid) → log sebagai anomaly, clamp ke 0–100 sebagai safety net.
- **Data Generated:** `final_score`, `persona`, `readiness`, `dimensions[]` (score+status tiap dimensi).
- **Permission:** Internal (backend only, tidak ada UI langsung).
- **Audit Trail:** Simpan snapshot hasil kalkulasi bersamaan dengan jawaban mentah (agar bisa diaudit ulang bila formula berubah di masa depan).

### F5 — KSM Gate & Recommendation Engine (Financial Rating)
- **Purpose:** Menentukan rekomendasi produk berdasarkan Bab 8.2–8.3.
- **User:** Sistem.
- **Main Flow:** Cek KSM Gate → jika PASS: `primary_recommendation = KSM`. Jika FAIL: cek dimensi terlemah → jalankan Path B/C/D/E sesuai prioritas.
- **Business Rules:** Wajib sesuai Bab 8.3, termasuk Priority Rule saat banyak dimensi bermasalah.
- **Data Generated:** `primary_recommendation`, `secondary_recommendation` (opsional), `ksm_gate` (boolean).
- **Permission:** Internal.

### F6 — Financial Health Result Page
- **Purpose:** Menampilkan hasil ke nasabah sesuai spesifikasi Bab "17. Yang ditampilkan ke Customer" pada dokumen.
- **User:** Nasabah.
- **Preconditions:** Submission selesai dihitung.
- **Main Flow:** Tampilkan skor besar (misal "78/100"), nama persona, deskripsi singkat, status 6 dimensi (label Strong/Good/Improve/Priority), lalu section "Your Next Move" dengan rekomendasi + CTA.
- **Data Displayed:** `final_score`, `persona`, `dimensions[]`, rekomendasi utama + CTA text.
- **User Actions:** Klik CTA (misal "Explore KSM →").
- **Success Feedback:** Halaman hasil tampil penuh tanpa perlu reload.
- **Permission:** Publik (hanya pemilik session yang bisa lihat hasilnya sendiri).

> **Update (dikonfirmasi client):** CTA seperti "Explore KSM →" mengarah ke **WhatsApp CS** (klik → buka chat WA ke nomor CS). Behaviour: tombol membuka link `wa.me/{no_cs}?text={pesan_prefill}` di tab/app baru.
>
> **✅ FINAL (dikonfirmasi client):** Dipilih **round-robin** ke 3 nomor CS (bukan mapping per produk). Setiap kali ada klik CTA rekomendasi, sistem memilih 1 dari 3 nomor CS secara bergantian agar beban chat merata ke semua CS, terlepas dari produk yang direkomendasikan.
> - Implementasi: tabel `cs_contact` menyimpan daftar nomor CS + counter/index sederhana (`last_used_index`) yang bertambah setiap kali CTA diklik, lalu `nomor_dipilih = daftar_cs[last_used_index % jumlah_cs]`.
> - Nomor WA CS **masih pakai data placeholder** saat development dan **wajib diganti dengan nomor asli sebelum demo/go-live** — tinggal update lewat tabel di Supabase, tanpa perlu ubah kode/redeploy.

### F7 — Financial Needs Quiz Engine (10 Pertanyaan)
- **Purpose:** Mengumpulkan 10 jawaban untuk assessment kebutuhan kredit.
- **User:** Nasabah.
- Sama polanya dengan F2, namun jumlah opsi bervariasi per soal (4–6 opsi) dan **setiap opsi menambah skor ke 3 kategori sekaligus** (KSM/KPR/KKB), bukan 1 skor tunggal.
- **Data Generated:** Array jawaban `{question_id, option_id, ksm_points, kpr_points, kkb_points}`.

### F8 — KSM/KPR/KKB Scoring & Tie-Breaker Engine
- **Purpose:** Implementasi algoritma Bab 8.5 secara presisi.
- **Main Flow:** Sum semua poin per kategori → cari skor tertinggi → cek selisih → jalankan threshold rule → jika tie, jalankan Tie-Breaker berurutan (Actual Need → Urgency → Asset Gap → Life Stage) → tentukan 1 atau 2 produk rekomendasi.
- **Business Rules:** Wajib divalidasi dengan **6 skenario contoh** & **4 contoh kasus (Case A–D)** yang ada di dokumen (dipakai sebagai automated test case, lihat Bab 26).
- **Permission:** Internal.

### F9 — Financial Needs Result Page
- **Purpose:** Menampilkan hasil rekomendasi produk kredit (1 atau 2 produk).
- **Main Flow:** Jika single recommendation → tampilkan 1 produk + alasan singkat. Jika dual → tampilkan 2 opsi produk dengan copy "kebutuhanmu terlihat berimbang..." + 2 CTA ("Lihat Pilihan KPR" / "Lihat Pilihan KSM", dst).
- **Data Displayed:** `primary_recommendation`, `secondary_recommendation` (jika ada), confidence level (Strong/Recommendation/Dual).
- **Permission:** Publik (khusus pemilik sesi).
- **CTA:** Sama seperti F6 — setiap tombol ("Lihat Pilihan KPR"/"Lihat Pilihan KSM") mengarah ke WA CS, dipilih secara round-robin dari 3 nomor CS (lihat mekanisme di F6).

### F10 — Admin / Branch Dashboard
- **Purpose:** Menampilkan seluruh submission ke tim cabang untuk follow-up, serta mengelola data bila ada input yang salah.
- **User:** Admin Cabang.
- **Preconditions:** Login berhasil (lihat F11 di bawah).
- **Main Flow:** Login → lihat tabel daftar submission (nama/kontak, tanggal, jenis assessment, hasil ringkas) → klik salah satu untuk lihat detail lengkap → **(✅ dikonfirmasi client) admin bisa Edit atau Hapus submission** bila ada kesalahan input.
- **Validation:** Hanya user dengan kredensial valid yang bisa akses.
- **✅ Dikonfirmasi client:** Admin **diizinkan mengubah & menghapus** data submission (bukan read-only). Agar tetap aman, diterapkan safeguard berikut (praktik standar, bukan pembatasan tambahan dari fitur yang diminta):
  - **Konfirmasi wajib** sebelum hapus (modal "Yakin hapus data ini? Tindakan ini tidak bisa dibatalkan").
  - **Soft-delete**, bukan hapus permanen dari database — record ditandai `deleted_at` sehingga masih bisa dipulihkan jika ternyata salah hapus (lihat Bab 12.3).
  - **Setiap edit/delete otomatis tercatat di audit log** (data sebelum & sesudah, siapa yang melakukan, kapan) — lihat Bab 25. Ini penting justru karena admin punya akses ubah/hapus, supaya tetap bisa ditelusuri jika ada perubahan yang tidak diinginkan.
- **Success State:** Data tampil/berubah sesuai aksi yang dilakukan, disertai toast konfirmasi ("Data berhasil diperbarui/dihapus").
- **Error State:** Kredensial salah → pesan error jelas tanpa membocorkan apakah username/password yang salah (security best practice). Gagal simpan perubahan → tampilkan error, data asli tidak berubah.
- **Data Required:** Kredensial login. **Data Generated:** Session admin, log akses & log perubahan data (lihat Bab 25).
- **Permission:** Admin Cabang, Super Admin.
- **Audit Trail:** Catat setiap login, setiap edit/delete submission (wajib — lihat Bab 25), dan setiap kali admin membuka detail submission tertentu (opsional, untuk kepatuhan privasi data nasabah).

### F11 — Login Admin
- **Purpose:** Mengamankan akses dashboard.
- **Main Flow:** Admin input email + password → verifikasi via **Supabase Auth** (`signInWithPassword`) → redirect ke dashboard.
- **Validation:** Rate limit percobaan login sudah ditangani bawaan oleh Supabase Auth (tidak perlu implementasi manual).
- **Error State:** Kredensial salah, akun terkunci sementara, session expired.
- **Permission:** N/A (halaman publik untuk proses login itu sendiri).
- **✅ Dikonfirmasi client:** Login **hanya diwajibkan untuk Admin**. Nasabah tidak perlu login/registrasi apapun untuk mengisi assessment (cukup isi nama & no HP, lihat F13 di bawah).
- **✅ Keputusan tim dev:** 1 akun admin cukup untuk versi demo ini (client menyerahkan ke tim dev). Multi-akun per cabang menjadi Future Scope (Bab 30) jika nanti dibutuhkan.

### F12 — Loading / Result Experience
- **Purpose:** Memberi kesan "self-discovery", bukan ujian, sesuai instruksi eksplisit dokumen ("Jangan langsung: Calculating score...").
- **Main Flow:** Setelah submit jawaban terakhir → tampilkan urutan pesan animasi: *"Analyzing your financial habits..."* → *"Looking at your financial patterns..."* → *"Finding your financial profile..."* → baru tampilkan RESULT.
- **Business Rules:** Urutan pesan & tone (calm, personal) wajib dipertahankan, tidak boleh diganti dengan istilah teknis seperti "Calculating...".
- **Permission:** Publik.

### F13 — Identity Capture (Nama & No. HP Nasabah)
- **Purpose:** Menangkap identitas dasar nasabah agar data di dashboard cabang bisa di-follow up.
- **User:** Nasabah.
- **✅ Dikonfirmasi client (MVP saat ini):** Nasabah mengisi **nama** dan **nomor HP** secara manual **di awal**, sebelum mulai menjawab quiz (bukan di akhir).
- **🔭 Catatan untuk versi lanjutan (bukan untuk demo ini):** Client menyebutkan keinginan jangka panjang agar sistem bisa **otomatis mendeteksi nomor HP dari WhatsApp** saat nasabah klik link dari chat WA (tanpa perlu isi manual). Ini **secara teknis dimungkinkan** dengan pendekatan seperti click-to-chat parameter (`wa.me` dengan parameter custom) atau WhatsApp Business API dengan webhook — namun ini **butuh integrasi resmi WA Business API**, yang sebelumnya sudah disepakati **di luar scope demo ini** (lihat Bab 5 — Out of Scope). Direkomendasikan tetap pakai input manual untuk versi sekarang, dan auto-detect dicatat sebagai **Future Scope (V2)** di Bab 30 — baru relevan kalau project ini naik status jadi resmi & pakai WA Business API asli.
- **Business Rule turunan:** Karena tidak ada akun/login nasabah, nomor HP yang diisi di awal ini dipakai sebagai **identifier unik** untuk menerapkan aturan "hanya boleh isi 1x per orang" (lihat F14 & Bab 8.7).
- **Validation:** Format nomor HP Indonesia valid (misal: awalan 08xx atau +62), nama tidak boleh kosong.
- **Data Generated:** `customer_name`, `customer_phone` (disimpan di record `submission`, lihat Bab 12.3).
- **Permission:** Publik.

### F14 — Pembatasan "1x Isi per Nasabah" ✅ FINAL (dikonfirmasi client)
- **Purpose:** Mencegah 1 nasabah mengisi assessment berkali-kali, sesuai instruksi client ("Hanya sekali aja mas perorangnya").
- **Main Flow:** Setelah nasabah isi nomor HP di F13 → sistem cek apakah nomor HP tsb sudah pernah submit **assessment jenis yang sama** sebelumnya.
- **✅ Dikonfirmasi client:** Pembatasan berlaku **per jenis assessment** — "1 kali per kuis, jadi bisa 2x tapi kuis yang berbeda". Artinya 1 nomor HP boleh isi **Financial Health 1x** DAN **Financial Needs 1x** (total maksimal 2 submission, beda jenis).
- **✅ Dikonfirmasi client (behavior saat sudah pernah isi):** **Langsung tampilkan report/hasil yang lama** (bukan sekadar pesan penolakan). Alur: nasabah isi nomor HP → sistem deteksi sudah pernah submit assessment jenis ini → sistem ambil `submission_id` lama miliknya → langsung redirect ke halaman hasil dengan data submission lama tsb (skip quiz sepenuhnya, tidak perlu isi ulang jawaban).
- **Data Required:** `customer_phone` + `assessment_type` sebagai composite unique lookup terhadap tabel `submission` (query: cari submission existing dengan `customer_phone` + `assessment_type` yang sama, ambil `submission_id` terbaru jika ternyata ada lebih dari 1 karena race condition).
- **Permission:** Publik.

---

## 11. EDGE CASE & ERROR HANDLING

| Kasus | Respons Sistem yang Diharapkan |
|---|---|
| Nasabah menutup browser di tengah quiz | Progress tidak wajib disimpan permanen (guest session) — jika dibuka lagi, mulai dari awal. *(Assumption; simpan-progress bisa jadi V2 jika dikonfirmasi perlu)* |
| Nasabah refresh halaman saat quiz berjalan | Jawaban yang sudah diisi tetap ada (simpan di local storage/session storage per soal) agar tidak perlu mengulang dari Q1. |
| Submit dilakukan dua kali (double click) | Tombol submit di-disable setelah diklik pertama; backend idempotent terhadap `session_id` yang sama untuk mencegah duplikasi record. |
| Jawaban tidak lengkap saat submit (mis. karena bug frontend) | Backend validasi ulang: bila ada `question_id` yang hilang, tolak submit dan kembalikan ke soal yang belum terjawab. |
| Data pertanyaan/skor tidak ditemukan (mis. `question_id` tidak valid) | Tampilkan error umum yang ramah + log detail teknis untuk developer, jangan tampilkan raw error ke user. |
| Server error / API gagal saat submit | Tampilkan pesan retry ramah ("Sepertinya ada gangguan, coba lagi ya") + tombol retry, jangan hilangkan jawaban yang sudah diisi. |
| Koneksi internet terputus | Deteksi offline, tampilkan indikator, otomatis retry saat online kembali. |
| Login admin gagal berkali-kali | Terapkan cooldown/lockout sementara setelah N percobaan gagal. |
| Session admin habis (expired) di tengah aktivitas | Redirect ke halaman login dengan pesan "Sesi berakhir, silakan login kembali", data yang sedang dilihat tidak hilang setelah login ulang (kembali ke halaman terakhir). |
| Dua kategori skor (KSM/KPR/KKB) sama persis | Jalankan Tie-Breaker Rule (Bab 8.5) — **jangan** menampilkan hasil acak/asal pilih salah satu. |
| Ketiga skor sangat berdekatan | Tampilkan "No Strong Recommendation" + multi-produk, bukan memaksakan 1 pemenang (sesuai Skenario 6 dokumen). |
| Final Score hasil kalkulasi di luar 0–100 (harusnya tidak terjadi jika data skor opsi valid) | Clamp ke rentang 0–100 sebagai safety net, sekaligus log sebagai anomaly untuk dicek developer. |
| Opsi jawaban dengan skor kosong/tidak terisi | Q1 & Q6 Financial Needs **dikonfirmasi** hanya 3 opsi (a–c), opsi "d." memang tidak ada — ✅ resolved. Q8 Financial Rating **skor final sudah dikonfirmasi client** (lihat Bab 31) — ✅ resolved. |
| Admin membuka detail submission yang datanya sudah dihapus/tidak ada | Tampilkan pesan "Data tidak ditemukan", bukan halaman kosong/blank. |
| Nasabah mencoba mengisi assessment >1 kali | Diperbolehkan (tidak ada aturan pembatasan disebutkan di dokumen) — setiap submission dicatat terpisah. *Assumption, perlu dikonfirmasi jika client ingin membatasi.* |

---

## 12. DATA & DATABASE REQUIREMENTS

> Desain di bawah sengaja dibuat sederhana (tidak over-engineered) sesuai skala proyek demo.

### 12.1 Entity: `question_bank`
Menyimpan master pertanyaan & opsi untuk kedua assessment (agar tidak hardcode di frontend).

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `question_id` | string (PK) | ✅ | mis. `Q1_RATING`, `Q1_NEEDS` |
| `assessment_type` | enum(`RATING`,`NEEDS`) | ✅ | menentukan flow |
| `dimension` | string | opsional | hanya untuk RATING (Cash Flow, dst.) |
| `question_text` | text | ✅ | teks pertanyaan |
| `order_index` | int | ✅ | urutan tampil |
| `is_scoring` | boolean | ✅ | false untuk Q13/Q14 |

### 12.2 Entity: `question_option`

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `option_id` | string (PK) | ✅ | |
| `question_id` | FK → question_bank | ✅ | |
| `option_text` | text | ✅ | |
| `option_detail` | text | opsional | "keterangan tambahan" yang muncul saat diklik (khusus beberapa soal RATING) |
| `score_rating` | int | kondisional | untuk assessment RATING |
| `score_ksm` | int | kondisional | untuk assessment NEEDS |
| `score_kpr` | int | kondisional | untuk assessment NEEDS |
| `score_kkb` | int | kondisional | untuk assessment NEEDS |

### 12.3 Entity: `submission`
Satu record = satu kali nasabah menyelesaikan salah satu assessment.

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `submission_id` | UUID (PK) | ✅ | |
| `assessment_type` | enum(`RATING`,`NEEDS`) | ✅ | |
| `customer_name` | string | ✅ **Wajib** | Diisi manual di awal quiz (F13) |
| `customer_phone` | string | ✅ **Wajib** | Diisi manual di awal quiz; dipakai sebagai unique key untuk aturan "1x isi per orang" (F14) — index unique per `(customer_phone, assessment_type)`, ✅ dikonfirmasi client: berlaku per jenis assessment |
| `submitted_at` | timestamp | ✅ | |
| `final_score` | int (0–100) | kondisional (RATING) | |
| `persona` | string | kondisional (RATING) | |
| `readiness` | enum(`HIGH`,`MEDIUM`,`LOW`) | kondisional (RATING) | |
| `ksm_gate` | boolean | kondisional (RATING) | |
| `financial_goal` | string | kondisional (RATING) | |
| `financial_need` | string | kondisional (RATING) | |
| `ksm_score` / `kpr_score` / `kkb_score` | int | kondisional (NEEDS) | |
| `primary_recommendation` | string | ✅ | |
| `secondary_recommendation` | string | opsional | jika dual recommendation |
| `recommendation_confidence` | enum(`STRONG`,`MODERATE`,`DUAL`,`NONE`) | ✅ | |
| `updated_at` | timestamp | opsional | terisi otomatis saat admin edit data (✅ ditambahkan karena admin sekarang bisa edit — lihat F10) |
| `updated_by` | UUID (FK → admin, nullable) | opsional | admin terakhir yang mengubah data |
| `deleted_at` | timestamp (nullable) | opsional | **soft-delete** — diisi saat admin "menghapus" data (bukan hapus permanen), lihat F10 |

### 12.4 Entity: `submission_answer`
Detail jawaban mentah per pertanyaan (untuk audit & recalculation bila formula berubah).

| Field | Tipe | Wajib |
|---|---|---|
| `id` | PK | ✅ |
| `submission_id` | FK | ✅ |
| `question_id` | FK | ✅ |
| `option_id` | FK | ✅ |

### 12.5 Entity: `dimension_result` (khusus RATING)

| Field | Tipe | Wajib |
|---|---|---|
| `id` | PK | ✅ |
| `submission_id` | FK | ✅ |
| `dimension` | string | ✅ |
| `raw_score` | float | ✅ |
| `contribution` | float | ✅ |
| `status` | enum(`STRONG`,`GOOD`,`IMPROVE`,`PRIORITY`) | ✅ |

### 12.6 Entity: `admin_user` — ✅ Diganti Supabase Auth

> **Keputusan (lihat Bab 5.1):** Tabel custom di bawah ini **tidak diimplementasikan manual**. Login admin memakai **Supabase Auth** bawaan (tabel `auth.users` terkelola otomatis oleh Supabase). Tabel `admin_profile` di bawah hanya menyimpan data tambahan yang tidak ada di `auth.users` (mis. role, nama cabang).

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | UUID (FK ke `auth.users.id`) | ✅ | 1:1 dengan akun Supabase Auth |
| `role` | enum(`BRANCH_ADMIN`,`SUPER_ADMIN`) | ✅ | Super Admin = future scope |
| `branch_name` | string | opsional | untuk V2 multi-cabang |
| `created_at` | timestamp | ✅ | otomatis dari Supabase |

### 12.7 Entity: `cs_contact` *(baru — hasil klarifikasi CTA & multi-CS)*
Konfigurasi statis nomor WA CS tujuan CTA (Bab 8.6/F6), dipakai bergiliran (round-robin) — ✅ final sesuai konfirmasi client.

| Field | Tipe | Wajib | Keterangan |
|---|---|---|---|
| `id` | PK | ✅ | |
| `wa_number` | string | ✅ | nomor WA CS tujuan |
| `display_order` | int | ✅ | urutan giliran round-robin (1, 2, 3) |
| `is_active` | boolean | ✅ | agar CS bisa dinonaktifkan sementara tanpa dihapus (misal sedang cuti) tanpa mengganggu urutan |
| `prefill_message` | text | opsional | template pesan yang otomatis terisi saat CTA diklik |

- Counter round-robin (`last_used_index`) disimpan terpisah (mis. 1 baris di tabel kecil `cs_rotation_state`, atau field global) dan di-increment setiap kali CTA diklik, lalu nomor dipilih = `cs_contact` aktif ke-`(last_used_index % jumlah_cs_aktif)`.

### 12.8 Relasi Konseptual
```
question_bank (1) ── (N) question_option
submission (1) ── (N) submission_answer ── (N) question_bank/option
submission (1) ── (N) dimension_result   [khusus RATING]
admin_profile (1:1 dgn auth.users Supabase) ── (N) login_log [audit, lihat Bab 25]
cs_contact  (N) ── digunakan oleh CTA di Result Page (F6/F9)
```

---

## 13. NOTIFICATION & COMMUNICATION

> **Assumption / Need Confirmation:** Dokumen client **tidak menyebutkan** kebutuhan notifikasi apapun (email/WA/push) ke nasabah maupun ke admin setelah submission masuk. Untuk versi demo/MVP, notifikasi **diasumsikan Out of Scope**. Jika client menginginkan, opsi yang bisa dipertimbangkan di V2:
- In-app: badge/counter "submission baru" di dashboard admin.
- Email ke admin cabang setiap ada submission baru (memerlukan SMTP setup — tambahan biaya/kompleksitas, tidak disarankan untuk versi demo Rp400–500rb).

---

## 14. DASHBOARD & INFORMATION ARCHITECTURE

**Sitemap:**
```
/ (Landing Page - pilihan assessment)
├── /financial-health
│   ├── /financial-health/quiz (Q1–Q14, single page app style)
│   └── /financial-health/result
├── /financial-needs
│   ├── /financial-needs/quiz (Q1–Q10)
│   └── /financial-needs/result
└── /admin
    ├── /admin/login
    ├── /admin/dashboard (list submission, filter, search)
    └── /admin/submission/:id (detail)
```

Navigasi dirancang berdasarkan **mental model pengguna**:
- Nasabah: linear, satu arah (tidak perlu menu kompleks — quiz funnel klasik: mulai → jawab → hasil).
- Admin: struktur dashboard standar (list → detail), tanpa menu bertingkat karena scope-nya kecil (belum perlu sidebar kompleks di MVP).

---

## 15. UI/UX REQUIREMENTS

Prinsip desain yang dipegang:
- **Bukan terasa seperti ujian.** Bahasa hangat, personal, progresif (sesuai instruksi eksplisit dokumen soal loading experience).
- **Satu fokus per layar** — satu pertanyaan besar, jelas, dengan opsi jawaban besar & mudah diklik (mobile-first, karena entry point-nya WA/mobile).
- **Progress terlihat jelas** (progress bar sederhana: "Pertanyaan 3 dari 12"), agar nasabah tahu berapa lama lagi.
- **Hindari tampilan generik dashboard admin template** — dashboard tetap bersih namun punya identitas visual yang konsisten dengan sisi nasabah (bukan template CRUD generik).
- **Hierarki visual jelas** di result page: angka skor besar → persona → detail dimensi → rekomendasi (top-down sesuai urutan kepentingan informasi bagi user).
- Hindari dekorasi tanpa fungsi (gradient berlebihan, glassmorphism tanpa alasan, dsb).

---

## 16. PAGE-BY-PAGE SPECIFICATION

### 16.1 Landing Page
- **Purpose:** Entry point, memilih jenis assessment.
- **Target User:** Nasabah (mobile-first, datang dari WA).
- **Layout:** Header singkat (judul/branding) → 2 kartu pilihan besar berdampingan (stack di mobile) → footer minimal.
- **Components:** Card pilihan (icon + judul + deskripsi singkat 1 kalimat + CTA), tanpa navbar kompleks.
- **Data Displayed:** Judul & deskripsi masing-masing assessment.
- **User Actions:** Tap salah satu kartu.
- **Empty/Loading/Error State:** Tidak relevan (halaman statis), kecuali gagal load asset → fallback teks biasa.
- **Responsive:** Mobile = kartu ditumpuk vertikal; Desktop = kartu berdampingan horizontal dengan max-width agar tidak terlalu lebar.

### 16.2 Quiz Page (Reusable Component untuk kedua assessment)
- **Purpose:** Menampilkan 1 pertanyaan per layar & mengumpulkan jawaban.
- **Layout:** Progress indicator (atas) → teks pertanyaan (fokus utama) → daftar opsi (tombol besar, full-width di mobile) → tombol "Lanjut" (aktif setelah memilih) + tombol "Kembali" (opsional).
- **Components:** Progress bar, radio-button-style option cards, optional tooltip/expand untuk "keterangan tambahan" (khusus beberapa soal RATING yang punya detail saat diklik).
- **Interaction:** Tap opsi → highlight terpilih → tombol "Lanjut" enable → auto-scroll ke pertanyaan berikutnya (atau transisi halaman).
- **Empty State:** N/A. **Loading State:** Skeleton singkat saat pertanyaan pertama kali dimuat. **Error State:** Banner error + retry jika gagal simpan jawaban ke server.
- **Success Feedback:** Progress bar bertambah + transisi halus ke soal berikutnya.
- **Responsive:** Mobile = full-screen per soal (khas typeform-style); Desktop = konten di-center dengan max-width ~600px agar tidak terlalu lebar dibaca.

### 16.3 Result Page — Financial Health
- **Purpose:** Menampilkan hasil assessment 1 sesuai spesifikasi dokumen Bab 17.
- **Layout:** Skor besar di atas (mis. "78/100") → nama persona + 1 kalimat deskripsi → grid 6 status dimensi (label + warna sesuai status) → section "Your Next Move" (rekomendasi + CTA).
- **Components:** Score badge/gauge, persona card, dimension status chips (Strong/Good/Improve/Priority dengan warna berbeda), recommendation card dengan CTA button.
- **User Actions:** Klik CTA rekomendasi (lihat catatan open question soal tujuan CTA).
- **Loading State:** Loading experience bertahap sebelum halaman ini muncul (lihat F12).
- **Responsive:** Mobile = semua section ditumpuk vertikal; Desktop = skor+persona di kiri, grid dimensi di kanan (2 kolom).

### 16.4 Result Page — Financial Needs
- **Purpose:** Menampilkan hasil rekomendasi kredit (1 atau 2 produk).
- **Layout:** Judul hasil → card produk rekomendasi (nama produk, 1–2 kalimat alasan) → jika dual, 2 card berdampingan dengan CTA masing-masing.
- **Components:** Recommendation card(s), confidence indicator (opsional, internal saja — tidak perlu ditampilkan sebagai "confidence score" mentah ke nasabah agar tetap ramah).
- **Responsive:** Mobile = card ditumpuk; Desktop = 2 card side-by-side untuk dual recommendation.

### 16.5 Admin Login Page
- **Purpose:** Autentikasi admin cabang.
- **Layout:** Form sederhana di tengah layar — field username/email, password, tombol login.
- **Validation:** Format email valid, password tidak kosong.
- **Error State:** Pesan "Email atau password salah" (generik, tidak spesifik mana yang salah).

### 16.6 Admin Dashboard (List Submission)
- **Purpose:** Melihat seluruh submission untuk follow-up.
- **Layout:** Header dengan judul + filter bar (tanggal, jenis assessment, hasil rekomendasi) → tabel data → pagination di bawah.
- **Components:** Search bar, filter dropdown, data table, pagination.
- **Data Displayed:** Nama/kontak nasabah (jika ada), tanggal submit, jenis assessment, hasil ringkas (persona/skor atau produk rekomendasi).
- **User Actions:** Klik baris → buka detail; filter/sort/search.
- **Empty State:** "Belum ada data submission" + ilustrasi/teks ringan.
- **Responsive:** Mobile = tabel berubah jadi list card per baris (bukan tabel horizontal-scroll yang sulit dibaca).

### 16.7 Admin Submission Detail Page
- **Purpose:** Melihat detail lengkap 1 submission (semua jawaban + hasil kalkulasi), dan mengubah/menghapusnya bila perlu.
- **Layout:** Info nasabah di atas → hasil ringkas (skor/persona/rekomendasi) → detail jawaban per pertanyaan (collapsible/accordion agar tidak terlalu panjang) → tombol **Edit** & **Hapus** di bagian bawah/atas halaman.
- **User Actions:** Kembali ke list; **✅ Edit data** (nama/no HP/jawaban bila perlu dikoreksi); **✅ Hapus** (dengan modal konfirmasi, soft-delete); (opsional V2) tandai status follow-up.
- **Permission:** Admin (Edit & Delete diizinkan — dikonfirmasi client, dengan audit log wajib di setiap aksi, lihat Bab 25).
- **Success Feedback:** Toast "Perubahan disimpan" / "Data berhasil dihapus" setelah aksi berhasil.

---

## 17. FORM SPECIFICATION

### Form: Jawaban Quiz (per pertanyaan)
| Field | Label | Wajib | Validasi | Helper Text |
|---|---|---|---|---|
| Opsi jawaban | Sesuai teks pertanyaan | ✅ | Harus pilih tepat 1 dari beberapa opsi | Untuk beberapa soal RATING: klik opsi menampilkan "keterangan tambahan" sebagai helper text kontekstual |

- **Submit behavior:** Via tombol "Lanjut" eksplisit (bukan auto-advance) — ✅ *keputusan tim dev*, agar nasabah tidak salah tap dan sempat cek jawabannya dulu.
- **Cancel behavior:** ✅ *Keputusan tim dev:* Tombol "Kembali" ke soal sebelumnya disediakan (jawaban sebelumnya tetap tersimpan, bisa diubah) — biaya implementasi kecil, manfaat UX besar.
- **Confirmation:** Tidak perlu dialog konfirmasi per soal; hanya di submit akhir (opsional: "Yakin sudah selesai?" sebelum ke loading).

### Form: Login Admin
| Field | Label | Wajib | Validasi | Error Message |
|---|---|---|---|---|
| Email/Username | Email | ✅ | Format email valid | "Email atau password salah" |
| Password | Password | ✅ | Min 8 karakter | "Email atau password salah" |

---

## 18. TABLE & DATA MANAGEMENT (Admin Dashboard)

| Kolom | Keterangan |
|---|---|
| Nama/Kontak Nasabah | ✅ Selalu ada (wajib diisi nasabah, lihat F13) |
| Jenis Assessment | RATING / NEEDS |
| Tanggal Submit | Format lokal, sortable |
| Hasil Ringkas | Persona+Skor (RATING) atau Produk Rekomendasi (NEEDS) |
| Status Follow-up | *(opsional V2)* |

- **Sorting:** Berdasarkan tanggal (default terbaru dulu), bisa diubah ke skor.
- **Filtering:** Jenis assessment, rentang tanggal, jenis rekomendasi (KSM/KPR/KKB/CASA/Livin'). Data yang sudah di-soft-delete **tidak muncul** di list utama secara default (bisa ditambah toggle "tampilkan yang dihapus" di V2 untuk keperluan restore).
- **Search:** Berdasarkan nama/nomor kontak.
- **Pagination:** Standar 20–25 baris/halaman agar tidak berat.
- **Bulk Action:** Tidak diperlukan untuk MVP (skala data kecil).
- **Row Action:** Klik baris → buka detail; **✅ tombol Edit & Hapus** langsung di baris/detail (dikonfirmasi client — dengan modal konfirmasi untuk hapus, lihat F10).
- **Export:** *Need Confirmation* — apakah client butuh export CSV/Excel untuk keperluan presentasi/laporan.
- **Empty State:** Pesan ramah + ilustrasi sederhana bila belum ada data.

---

## 19. RESPONSIVE DESIGN

### Desktop (≥1024px)
- Layout dua kolom dimungkinkan di halaman hasil (skor di kiri, detail di kanan).
- Dashboard admin memakai tabel penuh dengan semua kolom terlihat.

### Tablet (768–1023px)
- Quiz tetap 1 kolom, konten di-center dengan max-width.
- Dashboard: tabel tetap ada namun kolom non-esensial (misal detail sekunder) bisa disembunyikan/collapsed.

### Mobile (<768px)
- **Sidebar/menu:** Tidak ada sidebar; admin dashboard pakai top bar simpel dengan menu hamburger bila perlu.
- **Table → Card List:** Tabel submission berubah jadi list card vertikal (nama, tanggal, hasil ringkas per card).
- **Form/Quiz:** Full-screen per pertanyaan, tombol besar mudah di-tap (min. 44px tinggi).
- **Action Button:** Sticky di bawah layar (tombol "Lanjut" selalu terlihat tanpa perlu scroll).
- **Filter:** Filter dashboard admin masuk ke bottom sheet/modal, bukan sidebar permanen.
- **Modal:** Full-screen modal di mobile, bukan modal kecil di tengah layar (agar mudah dibaca).

---

## 20. DESIGN SYSTEM

- **Visual Direction:** Bersih, hangat, personal — kesan "financial wellness app" modern, bukan "form pengajuan bank" yang kaku.
- **Color Strategy:** ✅ *Keputusan tim dev (tidak ada aset resmi dari client):* Palet netral (putih/abu terang) + aksen **biru tua/teal** (kesan trust, cocok konteks finansial) untuk CTA utama. Warna status dimensi (Strong/Good/Improve/Priority) memakai skala warna semantik konsisten (hijau tua → hijau muda → kuning/oranye → merah), bukan warna acak.
- **Logo:** Belum ada aset resmi dari client → sementara pakai **wordmark teks** (nama produk dalam tipografi tegas), mudah diganti dengan logo asli kapan saja tanpa mengubah struktur desain.
- **Typography:** Heading besar & tegas untuk skor/angka utama (mis. skor "78/100" jadi focal point visual), body text mudah dibaca ukuran cukup besar di mobile (≥16px), caption lebih kecil untuk helper text.
- **Spacing:** Sistem spacing konsisten (skala 4/8px) agar antar elemen tidak terasa sempit atau berantakan.
- **Border Radius:** Radius sedang & konsisten di semua card/button (kesan modern, tidak kaku).
- **Shadows:** Minimal, hanya dipakai untuk membedakan card dari background, bukan dekorasi.
- **Icons:** ✅ *Keputusan tim dev:* Pakai **Lucide Icons** (1 gaya line-icon konsisten, tersedia sebagai library React) untuk seluruh status dimensi, opsi goal, dan elemen visual lain — menggantikan emoji dari dokumen asli yang sebagian rusak/tidak terbaca saat ekstraksi. Tidak perlu menunggu aset dari client.
- **Reusable Components:** Button (primary/secondary), Option Card, Progress Bar, Status Chip/Badge, Data Table, Modal, Toast (untuk error/sukses ringan), Empty State, Loading Spinner/Skeleton.

---

## 21. ACCESSIBILITY

- Kontras warna teks vs background memenuhi standar minimum (WCAG AA) terutama pada status chip berwarna.
- Semua opsi jawaban dapat dinavigasi via keyboard (tab + enter) untuk pengguna desktop.
- Label form (login admin) terhubung jelas ke input (untuk screen reader).
- Indikasi error tidak hanya mengandalkan warna (tambahkan ikon/teks, bukan warna merah saja).
- Target area tap minimal 44x44px di mobile untuk semua tombol/opsi.
- Ukuran font body minimal cukup besar (≥16px) untuk keterbacaan di HP.

---

## 22. API REQUIREMENTS (Konseptual)

> Diimplementasikan sebagai **Next.js Route Handlers** (`app/api/.../route.ts`) yang berkomunikasi dengan **Supabase** (lihat Bab 5.1).

| Endpoint | Method | Auth | Deskripsi |
|---|---|---|---|
| `/api/questions?type=RATING` | GET | Publik | Ambil daftar pertanyaan+opsi assessment RATING dari Supabase (`question_bank`+`question_option`) |
| `/api/questions?type=NEEDS` | GET | Publik | Ambil daftar pertanyaan+opsi assessment NEEDS |
| `/api/submissions` | POST | Publik | Submit jawaban lengkap 1 assessment → hitung skor di server (Next.js) → insert ke Supabase (`submission`+`submission_answer`) via service role key → response berisi hasil kalkulasi |
| `/api/submissions` | GET | Admin (Supabase session) | List submission, mendukung filter (`type`, `date_from`, `date_to`, `recommendation`), sorting, pagination — dilindungi Supabase RLS (hanya role `authenticated`) |
| `/api/submissions/:id` | GET | Admin | Detail 1 submission lengkap dengan jawaban mentah |
| — | — | — | Login/logout admin **tidak perlu endpoint custom** — pakai Supabase Auth client langsung dari frontend (`supabase.auth.signInWithPassword` / `signOut`) |

- **Request/Response format:** JSON, mengikuti struktur contoh output di dokumen (Bab 16 dokumen client) untuk assessment RATING.
- **Validation:** Backend (Next.js route handler) memvalidasi seluruh jawaban lengkap sebelum menghitung skor; menolak request dengan `question_id`/`option_id` tidak valid.
- **Error Response:** Format konsisten, mis. `{ "error": { "code": "...", "message": "..." } }`.
- **Authorization:** Endpoint admin memverifikasi Supabase session (JWT) & role sebelum mengembalikan data; ditegakkan ganda lewat **Supabase RLS** di level database.
- **Pagination/Filtering/Sorting:** Standar query param (`page`, `limit`, `sort_by`, `filter[...]`) pada endpoint list submission.

---

## 23. SECURITY

- **Authentication:** Login admin memakai **Supabase Auth** (password hashing & session management sudah ditangani otomatis, tidak perlu implementasi manual).
- **Authorization:** Kontrol akses ditegakkan lewat **Supabase Row Level Security (RLS)**: `question_bank`/`question_option` = read-only publik; `submission`/`submission_answer` = insert-only publik (tanpa hak baca), read hanya untuk role `authenticated` (admin).
- **Input Validation:** Validasi semua input di backend (Next.js route handler), bukan hanya frontend — terutama `question_id`/`option_id` pada submission agar tidak bisa dimanipulasi untuk memalsukan skor.
- **Session Management:** Session admin dikelola Supabase Auth (JWT dengan expiry & refresh token), logout otomatis setelah idle dalam waktu tertentu.
- **Data Privasi Nasabah:** Karena kemungkinan menyimpan nama/kontak nasabah, akses ke data ini **wajib** dibatasi hanya untuk admin ber-login (lihat Bab 6 — rekomendasi login wajib untuk dashboard).
- **Rate Limiting:** Endpoint login dan submit dibatasi frekuensinya untuk mencegah spam/brute force sederhana.

> Karena ini proyek demo berskala kecil, security tidak perlu setara sistem perbankan produksi (tidak perlu 2FA, enkripsi tingkat lanjut, dsb.) — namun praktik dasar di atas tetap wajib demi menjaga data nasabah tidak bocor ke publik.

---

## 24. NON-FUNCTIONAL REQUIREMENTS

### Performance
- Halaman quiz harus ringan (tidak load semua 14/10 pertanyaan sekaligus dalam 1 payload besar bila tidak perlu — bisa lazy-load per soal jika diperlukan, meski untuk skala kecil ini opsional).
- Loading experience (F12) sebaiknya tidak lebih dari beberapa detik total agar tidak terasa lambat meski dibuat "seperti proses analisis".

### Security
(Lihat Bab 23.)

### Reliability
- Jawaban yang sudah diisi tidak boleh hilang akibat refresh (state persisted di client selama sesi berlangsung).
- Kalkulasi skor harus konsisten/deterministik — input jawaban yang sama selalu menghasilkan output yang sama.

### Scalability
- Untuk skala demo, target load sangat kecil (puluhan–ratusan submission). Arsitektur tidak perlu dirancang untuk concurrency tinggi, namun struktur data (Bab 12) tetap dibuat rapi agar mudah di-scale bila proyek ini nantinya benar-benar diadopsi resmi oleh perusahaan.

### Accessibility & Responsive
(Lihat Bab 19 & 21.)

---

## 25. AUDIT & LOGGING

| Aktivitas | Dicatat? | Detail yang Disimpan |
|---|---|---|
| Submission baru (nasabah) | ✅ | Timestamp, jenis assessment, hasil kalkulasi |
| Login admin (sukses/gagal) | ✅ | Timestamp, admin, status |
| **Admin edit data submission** | ✅ **Wajib** *(baru — karena admin bisa edit/hapus, dikonfirmasi client)* | Admin mana, submission mana, field apa saja yang berubah, nilai sebelum & sesudah, kapan |
| **Admin hapus (soft-delete) submission** | ✅ **Wajib** | Admin mana, submission mana, kapan, (data tetap ada di DB dengan flag `deleted_at`, bisa dipulihkan) |
| Admin membuka detail submission | Opsional (V2) | Admin mana, submission mana, kapan |
| Perubahan status follow-up (jika ada fitur ini) | Opsional (V2) | Status sebelum/sesudah, admin yang mengubah, waktu |

> **Kenapa edit/delete wajib dicatat (berbeda dari rencana awal read-only):** Karena admin sekarang punya akses mengubah/menghapus data (dikonfirmasi client), audit trail untuk 2 aksi ini **tidak bisa opsional** — ini satu-satunya cara memastikan histori data tetap bisa ditelusuri jika ada perubahan yang keliru atau perlu dipulihkan. Tabel `submission_audit_log` disarankan (kolom: `submission_id`, `admin_id`, `action` (`UPDATE`/`DELETE`/`RESTORE`), `old_value` (JSON), `new_value` (JSON), `created_at`).

---

## 26. ACCEPTANCE CRITERIA

**AC1 — Perhitungan Final Score (Financial Rating)**
- Given jawaban nasabah: Cash Flow (100,80), Debt (85,90), Emergency Fund (65,35), Saving (100,80), Investment (65,80), Protection (60,80)
- When sistem menghitung skor
- Then `final_score` harus menghasilkan **77.75 (dibulatkan menjadi 78)**, sesuai contoh perhitungan dokumen.

**AC2 — Persona berdasarkan Final Score**
- Given `final_score` = 74
- When sistem menentukan persona
- Then persona yang ditampilkan = **THE BUILDER** (rentang 70–84).

**AC3 — KSM Gate PASS**
- Given final_score=78, Cash Flow=85, Debt=75, Emergency Fund=50
- When sistem mengecek KSM Gate
- Then `ksm_gate = true` dan `primary_recommendation = KSM`.

**AC4 — KSM Gate FAIL walau skor tinggi**
- Given final_score=74, Cash Flow=85, **Debt=32**, Emergency Fund=80
- When sistem mengecek KSM Gate
- Then `ksm_gate = false` (karena Debt < 60), rekomendasi diarahkan ke **Debt Management Advice**, bukan KSM.

**AC5 — Financial Goal tidak override Readiness**
- Given final_score=52, financial_goal="Punya rumah"
- When sistem menentukan rekomendasi
- Then hasil tetap **LOW readiness → No KSM**, goal hanya memengaruhi copy/personalisasi, bukan kelayakan produk.

**AC6 — Financial Needs: Strong Recommendation**
- Given KSM=36, KPR=24, KKB=12
- When sistem menghitung rekomendasi
- Then selisih tertinggi (12) ≥ 5 → `primary_recommendation = KSM`, confidence = STRONG, tanpa secondary recommendation.

**AC7 — Financial Needs: Tie-Breaker by Actual Need**
- Given KSM=30, KPR=30 (tie), jawaban Q7 (actual need) = "Rumah"
- When sistem menjalankan tie-breaker
- Then `primary_recommendation = KPR` (actual need diprioritaskan di atas skor demografis).

**AC8 — Financial Needs: No Strong Recommendation**
- Given KSM=28, KPR=29, KKB=27 (selisih tertinggi hanya 2, dan ketiganya berdekatan)
- When sistem mengevaluasi hasil
- Then sistem **tidak** menampilkan 1 pemenang tunggal, melainkan **Dual/Multi Recommendation** (KPR+KSM) dengan copy "kebutuhan berimbang".

**AC9 — Admin Dashboard Access Control**
- Given seseorang belum login sebagai admin
- When mereka mencoba mengakses `/admin/dashboard`
- Then sistem redirect ke halaman login, tidak menampilkan data submission apapun.

**AC10 — Validasi Jawaban Lengkap**
- Given nasabah baru menjawab 10 dari 12 pertanyaan scoring
- When mereka mencoba submit
- Then sistem menolak submit dan mengarahkan kembali ke pertanyaan yang belum dijawab.

**AC11 — Identitas Wajib Sebelum Quiz**
- Given nasabah baru membuka salah satu flow assessment
- When mereka belum mengisi nama & nomor HP
- Then sistem menampilkan form identitas terlebih dahulu dan tidak mengizinkan lanjut ke Q1 sebelum keduanya terisi valid.

**AC12 — Pembatasan 1x Isi per Nomor HP**
- Given nomor HP tertentu sudah pernah menyelesaikan submission untuk 1 jenis assessment
- When nomor HP yang sama mencoba mengisi assessment jenis yang sama lagi
- Then sistem **tidak membuat submission baru**, melainkan langsung mengambil `submission_id` lama dan mengarahkan nasabah ke halaman hasil dengan report submission lama tersebut.

---

## 27. FEATURE PRIORITIZATION

| Fitur | Prioritas | Kategori |
|---|---|---|
| Landing Page (2 pilihan) | MVP | Must Have |
| Financial Quiz Engine (12 Q) + Scoring + KSM Gate + Recommendation | MVP | Must Have |
| Financial Needs Quiz Engine (10 Q) + Scoring + Tie-Breaker | MVP | Must Have |
| Result Page (kedua flow) | MVP | Must Have |
| Loading/Result Experience bertahap | MVP | Must Have |
| Admin Dashboard (list + detail, login) | MVP | Must Have |
| Identity Capture — nama & no HP di awal (F13) | MVP ✅ *dikonfirmasi* | Must Have |
| Pembatasan 1x isi per nomor HP (F14) | MVP ✅ *dikonfirmasi* | Must Have |
| CTA hasil → WA CS (round-robin ke 3 nomor, F6/F9) | MVP ✅ *dikonfirmasi, tinggal isi 3 nomor CS asli* | Must Have |
| Admin bisa Edit/Delete submission + audit log wajib | MVP ✅ *dikonfirmasi* | Must Have |
| Export data admin (CSV) | V1 | Should Have |
| Status follow-up per submission (admin) | V1 | Could Have |
| Auto-detect no HP dari klik WA (tanpa isi manual) | V2 *(butuh WA Business API resmi)* | Could Have |
| Notifikasi (email/in-app) submission baru | V2 | Could Have |
| CMS pengelolaan pertanyaan (Super Admin) | V2 | Could Have |
| Multi-cabang dengan akses terpisah | V2 | Could Have |
| Integrasi WA Business API resmi | Future (jika proyek jadi resmi) | Won't Have (saat ini) |
| Integrasi core banking / pengajuan resmi | Future | Won't Have (saat ini) |

---

## 28. REQUIREMENT TRACEABILITY MATRIX

| Client Requirement | Business Requirement | Feature | User Flow | Acceptance Criteria |
|---|---|---|---|---|
| Nasabah pilih antara 2 assessment | Goal (Bab 4.1) | F1 Landing Page | 9.1 (Step 1–2) | – |
| 12 pertanyaan, 6 dimensi, weighted score | Goal (Bab 4.2) | F2, F4 | 9.1 (Step 3–5) | AC1 |
| Persona & Readiness dari Final Score | Goal (Bab 4.2) | F4 | 9.1 (Step 5) | AC2 |
| KSM hanya muncul jika readiness sesuai | Goal (Bab 4.2) | F5 | 9.1 (Step 5) | AC3, AC4 |
| Goal tidak override Readiness | Business Rule 8.4 | F4/F5 | 9.1 | AC5 |
| 10 pertanyaan → skor KSM/KPR/KKB | Goal (Bab 4.2) | F7, F8 | 9.2 | AC6, AC7, AC8 |
| Tie-breaker bertingkat | Business Rule 8.5 | F8 | 9.2 (Step 3) | AC7 |
| Data masuk dashboard cabang | Problem Statement (Bab 3) | F10 | 9.1/9.2 (Step 6) | AC9 |
| Loading experience "self-discovery" | UX requirement dokumen Bab 18 | F12 | 9.1/9.2 | – |
| WA Blast tidak diperlukan (dari chat) | Scope (Bab 5) | – (Out of Scope) | – | – |

---

## 29. OPEN QUESTIONS & KEPUTUSAN — ✅ SEMUA SUDAH FINAL

> Seluruh pertanyaan sudah dijawab client secara langsung (putaran 1 & 2). Tidak ada lagi keputusan desain yang menggantung — PRD ini **siap dipakai untuk development**.

### ✅ Dikonfirmasi Client — Putaran 1
| # | Pertanyaan | Jawaban Client |
|---|---|---|
| A | Nama produk "Livin'" boleh dipakai? | Boleh, dipakai apa adanya |
| B | Admin dashboard perlu login? | Perlu (hanya untuk admin) |
| C | Nasabah perlu isi nama/no HP, kapan? | Di awal (manual) |
| D | CTA rekomendasi mengarah ke mana? | WA CS |
| E | Nasabah boleh isi berkali-kali? | Tidak, hanya 1x per jenis assessment |
| F | Q1 & Q6 Financial Needs opsi "d" kosong, gimana? | Memang cuma 3 opsi (a–c) |
| G | Teks opsi Q8 (Saving Habit)? | Sudah dikirim (lihat Bab 31) |

### ✅ Dikonfirmasi Client — Putaran 2
| # | Topik | Keputusan Final Client | Dampak ke PRD |
|---|---|---|---|
| 1 | Skor per opsi Q8 | **a=100, b=80, c=60, d=35, e=15** | Bab 31 (Appendix) — final, bukan usulan lagi |
| 2 | Mapping 3 nomor CS | **Round-robin** (bergantian ke 3 nomor, bukan dibagi per produk) | F6/F9 & entity `cs_contact` (Bab 12.7) diupdate ke skema round-robin |
| 3 | Cakupan aturan "1x isi" | **Per jenis assessment** — boleh isi Financial Health 1x + Financial Needs 1x (maks. 2x, beda jenis) | F14 — sesuai desain awal, sekarang resmi dikonfirmasi |
| 4 | Behavior saat nomor HP sudah pernah submit | **Langsung tampilkan report/hasil yang lama** (skip pesan penolakan, langsung ke halaman hasil) | F14 diupdate — bukan lagi "pesan + tombol", tapi auto-redirect ke hasil lama |
| 5 | Admin boleh edit/hapus data submission? | **✅ Boleh** (bukan read-only) | F10, Role Matrix (Bab 6.2), Data Model (soft-delete di Bab 12.3), Audit Log **wajib** (Bab 25) — lihat detail di bawah |
| 6 | Jumlah akun admin | 1 akun cukup untuk demo | F11 — sesuai desain awal |
| 7 | Branding/logo/warna | Bebas, ikuti desain tim dev | Bab 20 — palet biru tua/teal + wordmark placeholder |
| 8 | Icon/emoji yang corrupt di dokumen | Sesuaikan saja | Bab 20 — pakai Lucide Icons |

> **Catatan penting soal keputusan #5 (Admin bisa edit/hapus):** Karena ini mengubah submission nasabah yang jadi dasar rekomendasi, tim dev menambahkan 2 safeguard standar (bukan pembatasan tambahan terhadap fitur yang diminta, murni praktik baik implementasi): **(a) soft-delete** — data "dihapus" ditandai `deleted_at`, bukan langsung hilang permanen dari database, jadi masih bisa dipulihkan kalau salah hapus; **(b) audit log wajib** — setiap edit/hapus tercatat siapa & apa yang berubah (Bab 25). Ini tidak mengurangi kebebasan admin untuk edit/hapus, hanya memastikan ada jejak yang bisa ditelusuri.

### 🟡 Masih Butuh Data Nyata dari Client (bukan keputusan, tapi aset/data)
1. **3 nomor WhatsApp CS** yang sebenarnya (untuk diisi ke tabel `cs_contact`) — saat development memakai nomor placeholder dulu, tinggal diganti sebelum demo/go-live tanpa perlu ubah kode.
2. Jika ke depannya client punya **logo/aset visual resmi**, bisa dikirim kapan saja untuk menggantikan wordmark placeholder — tidak menghambat development saat ini.

---

## 30. FUTURE DEVELOPMENT

- CMS internal untuk mengelola pertanyaan & bobot skor tanpa perlu ubah kode (memudahkan bila bobot/skor sering direvisi client).
- Multi-cabang dengan dashboard terpisah per cabang + role Super Admin untuk mengelola semua cabang.
- Export laporan otomatis (harian/mingguan) ke admin.
- Integrasi resmi WhatsApp Business API bila project ini diadopsi resmi oleh perusahaan.
- Riwayat assessment per nasabah (jika nasabah nantinya diberi akun/login).
- A/B testing pada copy hasil & CTA untuk mengoptimalkan conversion ke produk yang direkomendasikan.

---

## 31. APPENDIX — TABEL REFERENSI LENGKAP (Sumber Dokumen Client)

Tabel di bawah adalah rujukan langsung dari dokumen client, digunakan sebagai **source of truth** untuk implementasi soal & skor. Developer wajib memakai data ini persis, bukan interpretasi ulang.

### A. Financial Rating Assessment — Ringkasan Bobot & Soal
| Dimensi | Bobot | Soal |
|---|---|---|
| Cash Flow | 25% | Q1, Q2 |
| Debt Management | 20% | Q3, Q4 |
| Emergency Fund | 20% | Q5, Q6 |
| Saving Habit | 15% | Q7, Q8 ✅ *final (lihat detail skor di bawah)* |
| Investment Habit | 10% | Q9, Q10 |
| Financial Protection | 10% | Q11, Q12 |
| Non-scoring | – | Q13 (Financial Goal), Q14 (Financial Need) |

*Detail skor per opsi tiap soal mengikuti persis tabel yang sudah tercantum di dokumen asli "Kredit_Web.pdf" bagian "List Pertanyaan" — tidak diulang di sini agar PRD tidak duplikatif, namun **wajib** dirujuk langsung ke dokumen asli saat implementasi/QA.*

**Q8 — Saving Habit (✅ FINAL — dikonfirmasi langsung oleh client):**
*Pertanyaan: "Kalau ada uang lebih di akhir bulan, biasanya kamu..."*

| Opsi | Teks | Skor |
|---|---|---|
| a | Sebagian besar ditabung | 100 |
| b | Sebagian ditabung, sebagian digunakan | 80 |
| c | Digunakan untuk kebutuhan atau keinginan | 60 |
| d | Sering habis tanpa terasa | 35 |
| e | Sudah tidak ada sisa | 15 |

> Skor final dari client (bukan lagi usulan tim dev).

### B. Financial Needs Assessment — 10 Pertanyaan & Bobot Skor KSM/KPR/KKB
Struktur: setiap pertanyaan memiliki beberapa opsi jawaban, dan **setiap opsi** menambahkan poin berbeda ke 3 akumulator (KSM, KPR, KKB) sekaligus. Rincian lengkap poin per opsi (Q1–Q10) mengikuti persis tabel "II. SISTEM SCORING" pada dokumen asli — dipakai sebagai source of truth implementasi & test data (Case A–D dan Skenario 1–6 dipakai sebagai regression test).

---

*Akhir dokumen. PRD ini bersifat draft dan wajib direview ulang bersama client, khususnya butir-butir di Bab 29 (Open Questions), sebelum development dimulai.*