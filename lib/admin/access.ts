// Kontrol akses dashboard admin (PRD Bab F10/F11, 23, AC9).
// Keputusan akses dibuat sebagai fungsi murni agar bisa di-unit-test (AC9)
// tanpa menyentuh Supabase — pemanggil (page/API) hanya mengumpulkan fakta
// (sudah login? punya profil admin?) lalu meminta keputusannya di sini.

export type AccessDecision =
  | { allowed: true; reason: "OK" }
  | { allowed: false; reason: "NOT_AUTHENTICATED" }
  | { allowed: false; reason: "NOT_ADMIN" };

export interface AccessInput {
  /** Sudah terverifikasi memiliki session Supabase Auth (auth.getUser() sukses). */
  authenticated: boolean;
  /** Punya baris di tabel `admin_profile` (role BRANCH_ADMIN/SUPER_ADMIN). */
  hasAdminProfile: boolean;
}

/**
 * AC9: belum login → ditolak (redirect ke login, tidak ada data yang bocor).
 * Sudah login tapi bukan admin (mis. akun Supabase lain) → juga ditolak
 * (verifikasi role ganda sesuai Bab 23, di luar RLS saja).
 */
export function canAccessDashboard(input: AccessInput): AccessDecision {
  if (!input.authenticated) return { allowed: false, reason: "NOT_AUTHENTICATED" };
  if (!input.hasAdminProfile) return { allowed: false, reason: "NOT_ADMIN" };
  return { allowed: true, reason: "OK" };
}
