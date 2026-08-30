"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Form login admin (F11, Bab 16.5, 17).
// - Autentikasi: Supabase Auth signInWithPassword langsung dari browser
//   (Bab 22 — tanpa endpoint custom; rate-limit login bawaan Supabase, Bab F11).
// - ErrorState: pesan GENERIK "Email atau password salah" — tidak
//   dibedakan mana yang salah (security best practice, Bab F10/16.5).
// - Param ?next=/admin/... dipakai agar setelah login kembali ke halaman
//   terakhir yang sedang dilihat (edge case session expired, Bab 11).

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;

type SubmitState = "idle" | "submitting";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uid = useId();
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
  const emailRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [shake, setShake] = useState(false);

  // Tujuan setelah login: wajib path internal /admin/... (cegah open redirect).
  const rawNext = searchParams.get("next") ?? "";
  const next = rawNext.startsWith("/admin/") ? rawNext : "/admin/dashboard";
  const sessionExpired = searchParams.get("expired") === "true";

  function validate(): boolean {
    let ok = true;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError("Email wajib diisi.");
      ok = false;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setEmailError("Format email belum tepat. Contoh: admin@demo.com");
      ok = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError("Password wajib diisi.");
      ok = false;
    } else if (password.length < PASSWORD_MIN) {
      setPasswordError(`Password minimal ${PASSWORD_MIN} karakter.`);
      ok = false;
    } else {
      setPasswordError(null);
    }

    return ok;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;

    if (!validate()) {
      triggerShake();
      return;
    }

    setState("submitting");
    setAuthError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Detail asli hanya untuk log developer — user selalu dapat pesan generik.
      console.error("[admin-login] signInWithPassword gagal:", error.message);
      setState("idle");
      setAuthError("Email atau password salah. Silakan coba lagi.");
      triggerShake();
      return;
    }

    router.replace(next);
    router.refresh();
  }

  function triggerShake() {
    setShake(false);
    requestAnimationFrame(() => setShake(true));
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-paper font-sans text-ink">
      <Background />
      <Header />

      <main className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-5 py-10 sm:px-6">
        <div className="reveal-up">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-deep">
            <span className="h-px w-8 bg-accent/50" aria-hidden />
            Akses admin
          </p>
          <h1 className="mt-4 font-serif text-[2rem] leading-[1.1] tracking-tight text-ink sm:text-4xl">
            Masuk ke dashboard
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted">
            Untuk tim cabang — lihat submission nasabah dan kelola datanya.
          </p>
        </div>

        {/* Sesi habis di tengah aktivitas (Bab 11) — jelaskan alasannya,
            setelah login kembali ke halaman yang tadi sedang dibuka (?next). */}
        {sessionExpired && (
          <p
            role="status"
            className="reveal-up ad-1 mt-6 flex items-start gap-2.5 rounded-2xl border border-accent/30 bg-accent-tint px-4 py-3 text-sm font-medium leading-snug text-accent-deep"
          >
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Sesi berakhir, silakan login kembali. Halaman yang tadi sedang
            kamu buka akan terbuka lagi setelah masuk.
          </p>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className={`reveal-up ad-2 mt-8 rounded-[1.75rem] border border-line bg-card p-6 sm:p-8 ${
            shake ? "shake" : ""
          }`}
          onAnimationEnd={() => setShake(false)}
        >
          {authError && (
            <p
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-2xl border border-error-line bg-error-tint px-4 py-3 text-sm font-medium leading-snug text-error-deep"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {authError}
            </p>
          )}

          <div className="space-y-4">
            <Field
              id={emailId}
              label="Email"
              icon={Mail}
              value={email}
              onChange={(value) => {
                setEmail(value);
                if (emailError) setEmailError(null);
              }}
              error={emailError}
              disabled={state === "submitting"}
              inputRef={emailRef}
              type="email"
              placeholder="nama@cabang.com"
              autoComplete="email"
            />
            <Field
              id={passwordId}
              label="Password"
              icon={Lock}
              value={password}
              onChange={(value) => {
                setPassword(value);
                if (passwordError) setPasswordError(null);
              }}
              error={passwordError}
              disabled={state === "submitting"}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-muted transition-colors hover:text-ink"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" aria-hidden />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" aria-hidden />
                  )}
                </button>
              }
            />
          </div>

          <button
            type="submit"
            disabled={state === "submitting"}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent px-7 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-deep active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {state === "submitting" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Memeriksa kredensial…
              </>
            ) : (
              <>
                Masuk
                <ArrowRight className="h-4 w-4" aria-hidden />
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted/90">
            Hanya untuk admin cabang. Aktivitas masuk dan perubahan data
            tercatat.
          </p>
        </form>
      </main>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  disabled?: boolean;
  type: string;
  placeholder: string;
  autoComplete: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  trailing?: React.ReactNode;
};

function Field({
  id,
  label,
  icon: Icon,
  value,
  onChange,
  error,
  disabled,
  type,
  placeholder,
  autoComplete,
  inputRef,
  trailing,
}: FieldProps) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-semibold text-ink"
      >
        {label}
      </label>
      <div
        className={[
          "flex items-center gap-1.5 rounded-2xl border bg-paper/70 pl-3.5 transition-[border-color,box-shadow] duration-200 focus-within:ring-4",
          error
            ? "border-error-line focus-within:border-error focus-within:ring-error/15"
            : "border-line focus-within:border-accent focus-within:ring-accent/15",
        ].join(" ")}
      >
        <Icon
          className={`h-[18px] w-[18px] shrink-0 ${error ? "text-error" : "text-muted"}`}
          aria-hidden
        />
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-12 w-full min-w-0 bg-transparent text-base text-ink placeholder:text-muted/50 focus:outline-none disabled:opacity-60"
        />
        {trailing}
      </div>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-error"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="relative z-10">
      <div className="mx-auto flex w-full max-w-[440px] items-center justify-between px-5 py-5 sm:px-6 sm:py-7">
        <Link
          href="/"
          className="-mx-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted transition-colors duration-200 hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Beranda
        </Link>
        <span className="inline-flex items-center gap-2.5">
          <span className="font-serif text-xl font-semibold tracking-tight text-ink">
            Livin<span className="text-accent">&rsquo;</span>
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-muted sm:block">
            Financial Wellness
          </span>
        </span>
      </div>
    </header>
  );
}

function Background() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="bg-dots absolute inset-x-0 top-0 h-[520px]" />
      <div className="glow absolute -top-28 left-[-14%] h-[440px] w-[440px] rounded-full" />
    </div>
  );
}
