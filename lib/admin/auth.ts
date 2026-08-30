import { createServerClientForSession } from "@/lib/supabase/server";
import { canAccessDashboard } from "./access";

// Guard session admin (PRD Bab 23): dipakai server component (page admin)
// DAN route handler API. Verifikasi dua lapis:
//   1. Supabase Auth — session/JWT valid (auth.getUser).
//   2. Role — user wajib punya baris `admin_profile` (bukan akun Supabase
//      random yang kebetulan login). Ditegakkan ulang oleh RLS di database.

export interface AdminSession {
  userId: string;
  email: string | null;
  role: string | null;
  branchName: string | null;
}

/**
 * Kembalikan data admin bila session valid + role admin, selain itu null.
 * Pemanggil wajib menindaklanjuti null:
 *  - di page  → redirect ke /admin/login (AC9);
 *  - di route → 401 UNAUTHORIZED.
 */
export async function requireAdmin(): Promise<AdminSession | null> {
  const supabase = await createServerClientForSession();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("admin_profile")
    .select("id, role, branch_name")
    .eq("id", user.id)
    .maybeSingle();

  const decision = canAccessDashboard({
    authenticated: true,
    hasAdminProfile: profile !== null,
  });
  if (!decision.allowed) return null;

  return {
    userId: user.id,
    email: user.email ?? null,
    role: profile?.role ?? null,
    branchName: profile?.branch_name ?? null,
  };
}
