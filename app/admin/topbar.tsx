"use client";

import { Loader2, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Top bar halaman admin — identitas konsisten dengan sisi nasabah
// (wordmark Livin' + badge), plus email admin & tombol keluar (Bab F10).

export default function AdminTopBar({
  email,
  title,
}: {
  email: string | null;
  title: string;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3.5 sm:px-8 sm:py-4">
        <Link
          href="/admin/dashboard"
          className="-mx-2 flex min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5"
          aria-label="Dashboard admin"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-tint text-accent-deep">
            <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-lg font-semibold leading-tight tracking-tight text-ink">
              Livin<span className="text-accent">&rsquo;</span>
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-muted sm:block">
              {title}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2.5">
          {email && (
            <span className="hidden max-w-[220px] truncate rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-muted md:block">
              {email}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="flex h-10 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-semibold text-ink transition-all duration-200 hover:border-error-line hover:bg-error-tint hover:text-error-deep active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <LogOut className="h-4 w-4" aria-hidden />
            )}
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
